'use strict';
const db = require('../config/database');
const { applyFilters, parseSort, parsePagination, paginatedResult } = require('../utils/queryBuilder');

const SORTABLE = ['data_inicio', 'titulo', 'categoria', 'status', 'created_at'];

const EventoModel = {
  async findAll(query = {}) {
    const pagination = parsePagination(query);
    const sort = parseSort(query, SORTABLE, 'data_inicio', 'ASC');

    const filters = [
      { column: 'titulo',    value: query.busca,     operator: 'LIKE' },
      { column: 'categoria', value: query.categoria, operator: '=' },
      { column: 'status',    value: query.status,    operator: '=' },
      { column: 'destaque',  value: query.destaque,  operator: '=' },
    ];

    // Contagem separada para evitar conflito com join embutido
    const countQ = applyFilters(db.from('eventos').select('*', { count: 'exact', head: true }), filters);
    const { count, error: countErr } = await countQ;
    if (countErr) throw countErr;

    // Dados com join de local
    const dataQ = applyFilters(db.from('eventos').select('*, locais(nome)'), filters);
    const { data, error: dataErr } = await dataQ
      .order(sort.field, { ascending: sort.dir === 'ASC' })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (dataErr) throw dataErr;

    // Contar participacoes em batch para evitar N+1
    const eventoIds = (data ?? []).map((e) => e.id);
    const inscrMap = {};
    if (eventoIds.length > 0) {
      const { data: pData } = await db
        .from('participacoes')
        .select('evento_id')
        .in('evento_id', eventoIds);
      for (const p of pData ?? []) {
        inscrMap[p.evento_id] = (inscrMap[p.evento_id] ?? 0) + 1;
      }
    }

    return paginatedResult(
      (data ?? []).map((ev) => ({ ...serializeEvento(ev), inscritos: inscrMap[ev.id] ?? 0 })),
      count,
      pagination
    );
  },

  async findBySlug(slug) {
    const { data: ev, error: evErr } = await db
      .from('eventos')
      .select('*, locais(*)')
      .eq('slug', slug)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev) return undefined;

    const [{ data: atividades, error: atErr }, { count: inscritos, error: inErr }, { data: palRows, error: palErr }] =
      await Promise.all([
        db.from('atividades_completas').select('*').eq('evento_id', ev.id).order('data').order('hora_inicio'),
        db.from('participacoes').select('*', { count: 'exact', head: true }).eq('evento_id', ev.id),
        db.from('evento_palestrantes').select('palestrantes(*)').eq('evento_id', ev.id),
      ]);
    if (atErr) throw atErr;
    if (inErr) throw inErr;
    if (palErr) throw palErr;

    const directPalestrantes = (palRows ?? []).map((r) => r.palestrantes).filter(Boolean);
    return serializeEventoCompleto(ev, atividades ?? [], inscritos ?? 0, directPalestrantes);
  },

  async findById(id) {
    const { data, error } = await db.from('eventos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return undefined;
    const { data: pals, error: palErr } = await db
      .from('evento_palestrantes').select('palestrante_id').eq('evento_id', id);
    if (palErr) throw palErr;
    return { ...data, palestrante_ids: (pals ?? []).map((p) => p.palestrante_id) };
  },

  async setPalestrantes(eventoId, palestranteIds) {
    const { error: delErr } = await db.from('evento_palestrantes').delete().eq('evento_id', eventoId);
    if (delErr) throw delErr;
    if (!palestranteIds.length) return;
    const rows = palestranteIds.map((pid) => ({ evento_id: eventoId, palestrante_id: pid }));
    const { error } = await db.from('evento_palestrantes').insert(rows);
    if (error) throw error;
  },

  async create(data) {
    const { palestrante_ids, ...rest } = data;
    const { data: row, error } = await db.from('eventos').insert(toRow(rest)).select('id').single();
    if (error) throw error;
    if (palestrante_ids?.length) await this.setPalestrantes(row.id, palestrante_ids);
    return this.findById(row.id);
  },

  async update(id, data) {
    const { palestrante_ids, ...rest } = data;
    const current = await this.findById(id);
    if (!current) return null;
    const { error } = await db.from('eventos')
      .update({ ...toRow({ ...current, ...rest }), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    if (palestrante_ids !== undefined) await this.setPalestrantes(id, palestrante_ids);
    return this.findById(id);
  },

  async remove(id) {
    const { data, error } = await db.from('eventos').delete().eq('id', id).select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },
};

function toRow(d) {
  return {
    slug:             d.slug,
    titulo:           d.titulo,
    descricao:        d.descricao ?? null,
    descricao_longa:  d.descricao_longa ?? null,
    categoria:        d.categoria ?? 'Congresso',
    cursos:           d.cursos ?? null,
    imagem_url:       d.imagem_url ?? null,
    data_inicio:      d.data_inicio,
    data_fim:         d.data_fim,
    hora_inicio:      d.hora_inicio ?? '08:00',
    hora_fim:         d.hora_fim ?? '18:00',
    local_id:         d.local_id ?? null,
    local_detalhe:    d.local_detalhe ?? null,
    mapa_url:         d.mapa_url ?? null,
    capacidade:       d.capacidade ?? 0,
    status:           d.status ?? 'rascunho',
    tags:             d.tags ?? null,
    organizador_nome: d.organizador_nome ?? null,
    organizador_email:d.organizador_email ?? null,
    destaque:         d.destaque ?? false,
  };
}

function serializeEvento(ev) {
  const local = ev.locais;
  const rest = Object.fromEntries(Object.entries(ev).filter(([k]) => k !== 'locais'));
  return {
    ...rest,
    data_inicio: fmtDate(rest.data_inicio),
    data_fim:    fmtDate(rest.data_fim),
    hora_inicio: fmtTime(rest.hora_inicio),
    hora_fim:    fmtTime(rest.hora_fim),
    local_nome:  local?.nome ?? null,
  };
}

function serializeEventoCompleto(ev, atividades, inscritos, directPalestrantes = []) {
  const local = ev.locais;
  const evRest = Object.fromEntries(Object.entries(ev).filter(([k]) => k !== 'locais'));

  const palMap = new Map();
  // Palestrantes vinculados diretamente ao evento
  for (const p of directPalestrantes) {
    palMap.set(p.id, { id: p.id, nome: p.nome, bio: p.bio, instituicao: p.instituicao, foto_url: p.foto_url });
  }
  // Palestrantes de atividades (sem sobrescrever)
  for (const a of atividades) {
    if (a.palestrante_id && !palMap.has(a.palestrante_id)) {
      palMap.set(a.palestrante_id, {
        id:         a.palestrante_id,
        nome:       a.palestrante_nome,
        bio:        a.palestrante_bio,
        instituicao:a.palestrante_instituicao,
        foto_url:   a.palestrante_foto_url,
      });
    }
  }

  return {
    ...evRest,
    data_inicio:    fmtDate(evRest.data_inicio),
    data_fim:       fmtDate(evRest.data_fim),
    hora_inicio:    fmtTime(evRest.hora_inicio),
    hora_fim:       fmtTime(evRest.hora_fim),
    local_nome:     local?.nome ?? null,
    local_tipo:     local?.tipo ?? null,
    inscritos,
    vagas_restantes: Math.max(0, evRest.capacidade - inscritos),
    palestrantes:   [...palMap.values()],
    atividades:     atividades.map((a) => ({
      ...a,
      vagas:           Number(a.vagas),
      inscritos:       Number(a.inscritos ?? 0),
      vagas_restantes: Math.max(0, Number(a.vagas) - Number(a.inscritos ?? 0)),
    })),
  };
}

const fmtDate = (v) => (v ? String(v).slice(0, 10) : v);
const fmtTime = (v) => (v ? String(v).slice(0, 5) : v);

module.exports = EventoModel;
