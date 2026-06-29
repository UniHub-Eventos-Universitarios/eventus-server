'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  // ── Limpa tudo (ordem: mais dependente primeiro) ──────────────────
  await db.from('presencas').delete().neq('id', 0);
  await db.from('inscricoes').delete().neq('id', 0);
  await db.from('atividades').delete().neq('id', 0);
  await db.from('eventos').delete().neq('id', 0);
  await db.from('locais').delete().neq('id', 0);
  await db.from('palestrantes').delete().neq('id', 0);
  await db.from('usuarios').delete().neq('id', 0);

  // ── Usuarios ───────────────────────────────────────────────────────
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const senhaUser  = await bcrypt.hash('senha123', 10);

  const { data: uRows, error: uErr } = await db.from('usuarios').insert([
    { nome: 'Administrador',    email: 'admin@universidade.edu.br',      senha_hash: senhaAdmin, role: 'admin' },
    { nome: 'Andrew Pimenta',   email: 'andrewpimenta.dev@gmail.com',    senha_hash: senhaAdmin, role: 'admin' },
    { nome: 'Prof. Carlos Silva', email: 'carlos@universidade.edu.br',   senha_hash: senhaUser, role: 'professor' },
    { nome: 'Ana Aluno',        email: 'ana@aluno.edu.br',               senha_hash: senhaUser, role: 'aluno' },
  ]).select('id');
  if (uErr) throw uErr;

  // ── Palestrantes ───────────────────────────────────────────────────
  const { data: pRows, error: pErr } = await db.from('palestrantes').insert([
    { nome: 'Dra. Helena Martins',  area: 'Inteligencia Artificial',  instituicao: 'USP',     email: 'helena@usp.br',     bio: 'Pesquisadora em aprendizado de maquina e visao computacional.' },
    { nome: 'Prof. Rafael Souza',   area: 'Seguranca da Informacao',  instituicao: 'UNICAMP', email: 'rafael@unicamp.br', bio: 'Especialista em criptografia e seguranca de aplicacoes web.' },
    { nome: 'Dra. Camila Oliveira', area: 'Cloud Computing',          instituicao: 'UFMG',    email: 'camila@ufmg.br',   bio: 'Arquiteta de solucoes em nuvem e sistemas distribuidos.' },
    { nome: 'Prof. Bruno Almeida',  area: 'Ciencia de Dados',         instituicao: 'PUC-SP',  email: 'bruno@pucsp.br',   bio: 'Atua com engenharia de dados e analise preditiva.' },
    { nome: 'Dra. Patricia Lima',   area: 'Engenharia de Software',   instituicao: 'UFSC',    email: 'patricia@ufsc.br', bio: 'Pesquisa metodologias ageis e qualidade de software.' },
  ]).select('id');
  if (pErr) throw pErr;
  const [p0, p1, p2, p3, p4] = pRows.map((r) => r.id);

  // ── Locais ────────────────────────────────────────────────────────
  const { data: lRows, error: lErr } = await db.from('locais').insert([
    { nome: 'Auditorio Principal',  tipo: 'auditorio',   andar: 'Terreo',   capacidade: 300, descricao: 'Auditorio central do evento.',         mapa_x: 20, mapa_y: 30 },
    { nome: 'Sala A-101',           tipo: 'sala',        andar: '1o andar', capacidade: 60,  descricao: 'Sala de palestras tematicas.',         mapa_x: 55, mapa_y: 25 },
    { nome: 'Laboratorio de Redes', tipo: 'laboratorio', andar: '2o andar', capacidade: 30,  descricao: 'Lab equipado para oficinas praticas.', mapa_x: 70, mapa_y: 60 },
    { nome: 'Espaco Maker',         tipo: 'externo',     andar: 'Patio',    capacidade: 80,  descricao: 'Area aberta para mesas e networking.', mapa_x: 40, mapa_y: 75 },
  ]).select('id');
  if (lErr) throw lErr;
  const [l0, l1, l2, l3] = lRows.map((r) => r.id);

  // ── Eventos ───────────────────────────────────────────────────────
  const { data: evRows, error: evErr } = await db.from('eventos').insert([
    {
      slug: 'semana-tecnologia-2026',
      titulo: 'Semana de Tecnologia 2026',
      descricao: 'O maior evento academico de TI da regiao, reunindo pesquisadores, professores e alunos.',
      descricao_longa: 'A Semana de Tecnologia 2026 e o principal evento academico de Tecnologia da Informacao da regiao. Durante tres dias, participantes terao acesso a palestras de alto nivel, oficinas praticas, mesas redondas e networking com profissionais renomados das areas de IA, Seguranca, Cloud e Dados.',
      categoria: 'Semana Acadêmica',
      cursos: ['Ciencia da Computacao', 'Engenharia de Software', 'Sistemas de Informacao'],
      imagem_url: null,
      data_inicio: '2026-09-14',
      data_fim: '2026-09-16',
      hora_inicio: '08:00',
      hora_fim: '18:00',
      local_id: l0,
      local_detalhe: 'Centro de Convencoes — Bloco A',
      mapa_url: null,
      capacidade: 300,
      status: 'ativo',
      tags: ['IA', 'Seguranca', 'Cloud', 'Dados', 'Engenharia'],
      organizador_nome: 'Universidade Academica',
      organizador_email: 'eventos@universidade.edu.br',
      destaque: true,
    },
    {
      slug: 'simposio-seguranca-digital-2026',
      titulo: 'Simposio de Seguranca Digital',
      descricao: 'Evento dedicado a criptografia, privacidade e seguranca de aplicacoes modernas.',
      descricao_longa: 'O Simposio de Seguranca Digital reune especialistas para discutir as principais ameacas e tendencias em seguranca da informacao. Com foco pratico e teorico, o evento abrange desde criptografia moderna ate hardening de sistemas em producao.',
      categoria: 'Simpósio',
      cursos: ['Seguranca da Informacao', 'Ciencia da Computacao'],
      imagem_url: null,
      data_inicio: '2026-10-05',
      data_fim: '2026-10-05',
      hora_inicio: '09:00',
      hora_fim: '17:00',
      local_id: l1,
      local_detalhe: 'Sala A-101, 1o andar',
      mapa_url: null,
      capacidade: 60,
      status: 'ativo',
      tags: ['Seguranca', 'Criptografia', 'Privacidade', 'LGPD'],
      organizador_nome: 'Universidade Academica',
      organizador_email: 'eventos@universidade.edu.br',
      destaque: false,
    },
  ]).select('id');
  if (evErr) throw evErr;
  const [ev0, ev1] = evRows.map((r) => r.id);

  // ── Atividades ────────────────────────────────────────────────────
  const { data: aRows, error: aErr } = await db.from('atividades').insert([
    // Semana de Tecnologia 2026
    { evento_id: ev0, titulo: 'Abertura: O Futuro da IA Generativa',       tipo: 'palestra',     trilha: 'IA',         palestrante_id: p0, local_id: l0, data: '2026-09-14', hora_inicio: '09:00', hora_fim: '10:30', vagas: 300, destaque: true,  descricao: 'Panorama das fronteiras atuais em modelos generativos.' },
    { evento_id: ev0, titulo: 'Hardening de APIs REST',                    tipo: 'oficina',      trilha: 'Seguranca',  palestrante_id: p1, local_id: l2, data: '2026-09-14', hora_inicio: '11:00', hora_fim: '13:00', vagas: 30,  destaque: true,  descricao: 'Pratica de protecao contra XSS, CSRF e injection.' },
    { evento_id: ev0, titulo: 'Arquiteturas Serverless na Pratica',        tipo: 'palestra',     trilha: 'Cloud',      palestrante_id: p2, local_id: l1, data: '2026-09-14', hora_inicio: '14:00', hora_fim: '15:30', vagas: 60,  destaque: false, descricao: 'Trade-offs e padroes de funcoes sem servidor.' },
    { evento_id: ev0, titulo: 'Pipelines de Dados com Streaming',          tipo: 'minicurso',    trilha: 'Dados',      palestrante_id: p3, local_id: l2, data: '2026-09-15', hora_inicio: '09:00', hora_fim: '12:00', vagas: 30,  destaque: false, descricao: 'Ingestao e processamento de dados em tempo real.' },
    { evento_id: ev0, titulo: 'SCRUM Alem do Quadro de Tarefas',           tipo: 'palestra',     trilha: 'Engenharia', palestrante_id: p4, local_id: l1, data: '2026-09-15', hora_inicio: '13:30', hora_fim: '15:00', vagas: 60,  destaque: true,  descricao: 'Como times maduros aplicam o framework agil.' },
    { evento_id: ev0, titulo: 'Mesa Redonda: Carreira em Tecnologia',      tipo: 'mesa_redonda', trilha: 'Carreira',   palestrante_id: p0, local_id: l3, data: '2026-09-15', hora_inicio: '16:00', hora_fim: '17:30', vagas: 80,  destaque: false, descricao: 'Debate aberto com pesquisadores e profissionais.' },
    { evento_id: ev0, titulo: 'Criptografia Moderna: do Bcrypt ao Argon2', tipo: 'oficina',      trilha: 'Seguranca',  palestrante_id: p1, local_id: l2, data: '2026-09-16', hora_inicio: '09:00', hora_fim: '11:00', vagas: 30,  destaque: false, descricao: 'Evolucao do armazenamento seguro de senhas.' },
    { evento_id: ev0, titulo: 'Observabilidade em Sistemas na Nuvem',      tipo: 'palestra',     trilha: 'Cloud',      palestrante_id: p2, local_id: l0, data: '2026-09-16', hora_inicio: '11:30', hora_fim: '13:00', vagas: 300, destaque: false, descricao: 'Metricas, logs e tracing distribuido.' },
    // Simposio de Seguranca
    { evento_id: ev1, titulo: 'Introducao a Seguranca Ofensiva',           tipo: 'palestra',     trilha: 'Seguranca',  palestrante_id: p1, local_id: l1, data: '2026-10-05', hora_inicio: '09:00', hora_fim: '10:30', vagas: 60,  destaque: false, descricao: 'Conceitos basicos de pentest e CTF.' },
    { evento_id: ev1, titulo: 'LGPD na Pratica para Desenvolvedores',      tipo: 'palestra',     trilha: 'Privacidade',palestrante_id: p4, local_id: l1, data: '2026-10-05', hora_inicio: '11:00', hora_fim: '12:30', vagas: 60,  destaque: false, descricao: 'Impactos da lei de protecao de dados no desenvolvimento.' },
    { evento_id: ev1, titulo: 'Workshop: Analise de Vulnerabilidades',     tipo: 'oficina',      trilha: 'Seguranca',  palestrante_id: p1, local_id: l2, data: '2026-10-05', hora_inicio: '14:00', hora_fim: '17:00', vagas: 30,  destaque: false, descricao: 'Laboratorio pratico de identificacao e exploracao de falhas.' },
  ]).select('id');
  if (aErr) throw aErr;
  const aIds = aRows.map((r) => r.id);

  // ── Inscricoes ────────────────────────────────────────────────────
  const { error: iErr } = await db.from('inscricoes').insert([
    { atividade_id: aIds[0], nome_participante: 'Joao Pereira', email: 'joao@email.com',   telefone: '(19) 99999-0001', status: 'confirmada' },
    { atividade_id: aIds[0], nome_participante: 'Maria Santos', email: 'maria@email.com',  telefone: '(19) 99999-0002', status: 'pendente' },
    { atividade_id: aIds[1], nome_participante: 'Carlos Dias',  email: 'carlos@email.com', telefone: '(19) 99999-0003', status: 'confirmada' },
  ]);
  if (iErr) throw iErr;

  // ── Presencas ─────────────────────────────────────────────────────
  const { error: prErr } = await db.from('presencas').insert([
    { usuario_id: uRows[2].id, atividade_id: aIds[0] }, // Ana marcou presenca na abertura
  ]);
  if (prErr) throw prErr;

  // ── Resumo ────────────────────────────────────────────────────────
  const n = async (t) => (await db.from(t).select('*', { count: 'exact', head: true })).count;
  console.log('Seed concluido:');
  console.log(`  usuarios:     ${await n('usuarios')}`);
  console.log(`  palestrantes: ${await n('palestrantes')}`);
  console.log(`  locais:       ${await n('locais')}`);
  console.log(`  eventos:      ${await n('eventos')}`);
  console.log(`  atividades:   ${await n('atividades')}`);
  console.log(`  inscricoes:   ${await n('inscricoes')}`);
  console.log(`  presencas:    ${await n('presencas')}`);
  console.log('\nCredenciais admin: admin@universidade.edu.br / admin123');
  console.log('Credenciais user:  ana@aluno.edu.br / senha123');
}

seed().catch((err) => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
