# Eventus — Plataforma de Eventos Acadêmicos

Central de eventos universitários: programação, palestrantes, oficinas, inscrições e controle de presença em um único lugar.

- **Backend:** Node.js + Express, arquitetura **MVC**, banco **Supabase (PostgreSQL)**
- **Auth:** JWT (Bearer token), roles `aluno | professor | admin`
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS (repositório separado: `eventus-ui`)

---

## Mapeamento dos entregáveis

| Sigla | Entregável | Onde está demonstrado |
|-------|------------|-----------------------|
| **DBE2** | Consulta com **paginação, filtros e ordenação** | `src/utils/queryBuilder.js` (`parsePagination`, `parseSort`, `applyFilters`) + todos os `GET` de listagem (`/eventos`, `/atividades`, `/palestrantes`, `/locais`, `/inscricoes`, `/eventos/:id/participantes`). Tela `/eventos` do frontend exercita filtros, ordenação e paginação ao vivo. |
| **BD2** | **Inclusão, alteração e exclusão** de registros (CRUD) | `POST/PUT/DELETE` em todas as entidades. Botão "Confirmar Presença" em `/eventos/:slug` cria participações (5 regras de negócio). Painéis `/admin/eventos`, `/admin/atividades`, `/admin/palestrantes`, `/admin/locais` e `/admin/inscricoes` cobrem CRUD completo. |
| **GAS1** | Metodologia ágil **SCRUM** | [`docs/SCRUM.md`](docs/SCRUM.md) — papéis, cerimônias, backlog (US01–US10), 3 sprints, métricas. |
| **QSS** | Relatório do **SonarQube** | [`docs/SONARQUBE.md`](docs/SONARQUBE.md) + `backend/sonar-project.properties`. |

---

## Estrutura do repositório

```
eventus-server/
├── backend/
│   ├── src/
│   │   ├── config/          env.js · database.js (Supabase client)
│   │   ├── controllers/     atividadeController · eventoController · inscricaoController
│   │   │                    localController · palestranteController · participacaoController
│   │   │                    presencaController · usuarioController
│   │   ├── database/        schema.sql · migrate.js · seed.js
│   │   ├── middlewares/     auth.js (requireAuth JWT) · errorHandler.js
│   │   ├── models/          atividadeModel · eventoModel · inscricaoModel
│   │   │                    localModel · palestranteModel · participacaoModel
│   │   │                    presencaModel · usuarioModel
│   │   ├── routes/          authRoutes · eventoRoutes · atividadeRoutes · localRoutes
│   │   │                    palestranteRoutes · inscricaoRoutes · presencaRoutes · index.js
│   │   ├── services/        atividadeService · eventoService · inscricaoService
│   │   │                    localService · palestranteService · participacaoService
│   │   │                    presencaService · usuarioService
│   │   └── utils/           ApiError.js · asyncHandler.js · queryBuilder.js
│   ├── tests/               atividades.test.js · recursos.test.js
│   ├── .env.example
│   ├── jest.config.js
│   ├── sonar-project.properties
│   └── package.json
├── docs/
│   ├── SCRUM.md
│   └── SONARQUBE.md
└── README.md
```

### Arquitetura MVC

```
Request → Routes → Controller → Service → Model → Supabase (PostgreSQL)
                    (thin)      (Zod +    (queries
                                regras)   Supabase JS)
```

- **Models** (`src/models`): queries assíncronas via `@supabase/supabase-js`. Aqui ficam paginação, filtros e ordenação — coração do **DBE2**.
- **Services** (`src/services`): validação com **Zod**, regras de negócio (vagas, duplicatas, conflitos de horário, permissões por role).
- **Controllers** (`src/controllers`): finos, apenas orquestram req/res.
- **Utils** (`src/utils/queryBuilder.js`): `applyFilters`, `parsePagination`, `parseSort`, `paginatedResult` — reutilizados em todos os models.
- **Views** PostgreSQL: `atividades_completas` e `inscricoes_completas` centralizam JOINs complexos.

---

## Banco de dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Contas (aluno / professor / admin), senha com bcrypt |
| `palestrantes` | Palestrantes com bio, área e instituição |
| `locais` | Locais com tipo (sala/auditório/laboratório/externo), andar e capacidade |
| `eventos` | Evento pai (congresso, simpósio…) com slug único, datas, status e capacidade |
| `atividades` | Sessões filhas de um evento (palestras, oficinas, mesas-redondas…) |
| `inscricoes` | Participante inscrito em uma atividade específica |
| `participacoes` | Confirmação de presença no evento (INSERT via botão "Confirmar Presença") |
| `presencas` | Registro de presença confirmada em atividade (professor / admin) |

> **Atenção:** a tabela `participacoes` deve ser criada manualmente via Supabase SQL Editor caso `migrate.js` não a inclua ainda:
> ```sql
> CREATE TABLE participacoes (
>   id          SERIAL PRIMARY KEY,
>   usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
>   evento_id   INTEGER NOT NULL REFERENCES eventos(id)  ON DELETE CASCADE,
>   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
>   UNIQUE (usuario_id, evento_id)
> );
> CREATE INDEX idx_participacoes_usuario ON participacoes(usuario_id);
> CREATE INDEX idx_participacoes_evento  ON participacoes(evento_id);
> ```

### Views

| View | Finalidade |
|------|-----------|
| `atividades_completas` | JOIN de atividades + palestrante + local + evento, com contador de inscritos |
| `inscricoes_completas` | JOIN de inscrições + usuário + atividade |

---

## Configuração

### 1. Variáveis de ambiente

Copie e preencha o arquivo `.env` dentro de `backend/`:

```bash
cd backend
cp .env.example .env
```

```env
PORT=3333
NODE_ENV=development

# Supabase — Project Settings → API
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Conexão direta para migrate.js
DATABASE_URL=postgresql://postgres:<senha>@db.<seu-projeto>.supabase.co:5432/postgres

CORS_ORIGIN=http://localhost:3000
JWT_SECRET=eventus-super-secret-change-in-production
JWT_EXPIRES_IN=8h
```

> **Onde obter as chaves:** Supabase Dashboard → seu projeto → **Project Settings → API**

### 2. Instalar dependências

```bash
cd backend
npm install
```

### 3. Criar o schema e popular dados

```bash
npm run db:migrate   # cria todas as tabelas e views no Supabase
npm run db:seed      # insere dados de exemplo
```

**Usuários criados pelo seed:**

| E-mail | Senha | Role |
|--------|-------|------|
| `admin@universidade.edu.br` | `admin123` | admin |
| `ana@aluno.edu.br` | `senha123` | aluno |

### 4. Iniciar a API

```bash
npm run dev          # desenvolvimento (hot-reload)
# ou
npm start            # produção
```

API disponível em `http://localhost:3333`

---

## Scripts

| Script | Ação |
|--------|------|
| `npm start` | Inicia a API (`node src/server.js`) |
| `npm run dev` | Hot-reload com `node --watch` |
| `npm run db:migrate` | Cria schema no Supabase |
| `npm run db:seed` | Popula dados de exemplo |
| `npm run db:reset` | `migrate` + `seed` |
| `npm test` | Suíte Jest (37 testes) |
| `npm run test:coverage` | Testes + relatório LCOV para SonarQube |
| `npm run sonar` | Executa o `sonar-scanner` |

---

## Endpoints da API

Base URL: `http://localhost:3333/api`

### Autenticação (`/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/register` | — | Cria conta (role padrão: `aluno`) |
| `POST` | `/auth/login` | — | Login → retorna JWT |
| `GET` | `/auth/me` | ✔ | Perfil do usuário logado |
| `GET` | `/auth/me/presencas` | ✔ | Presenças em atividades do usuário logado |
| `GET` | `/auth/me/eventos` | ✔ | Eventos confirmados pelo usuário (participações) |

**Exemplo — Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@universidade.edu.br", "senha": "admin123" }
```

```json
{ "token": "eyJ...", "user": { "id": 1, "nome": "Admin", "email": "...", "role": "admin" } }
```

---

### Eventos (`/eventos`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/eventos` | — | Lista eventos (DBE2: filtros + paginação + ordenação) |
| `GET` | `/eventos/:slug` | — | Detalhe completo com atividades e palestrantes |
| `GET` | `/eventos/id/:id` | — | Busca por ID numérico (usado no admin de edição) |
| `POST` | `/eventos` | admin | Cria evento |
| `PUT` | `/eventos/:id` | admin | Atualiza evento |
| `DELETE` | `/eventos/:id` | admin | Remove evento |
| `GET` | `/eventos/:id/participar` | ✔ | Status de participação do usuário logado |
| `POST` | `/eventos/:id/participar` | ✔ | **BD2:** Confirma presença (5 regras de negócio) |
| `DELETE` | `/eventos/:id/participar` | ✔ | **BD2:** Cancela participação |
| `GET` | `/eventos/:id/participantes` | admin | Lista participantes do evento (DBE2) |

**Query params (DBE2):**
```
GET /api/eventos?busca=tecnologia&categoria=Simpósio&status=ativo
                &sortBy=data_inicio&sortDir=asc&page=1&perPage=6
```

**Resposta paginada:**
```json
{
  "data": [ { "id": 1, "slug": "semana-tecnologia-2026", "titulo": "...", ... } ],
  "meta": { "total": 4, "page": 1, "perPage": 6, "totalPages": 1, "hasPrev": false, "hasNext": false }
}
```

**Regras de negócio — Confirmar Presença (`POST /eventos/:id/participar`):**
1. Evento deve ter `status = 'ativo'`
2. `data_fim + hora_fim` não pode ter passado (evento expirado)
3. Usuário não pode confirmar presença duas vezes no mesmo evento
4. Se `capacidade > 0`, verifica se ainda há vagas disponíveis
5. Detecta conflito de horário com outros eventos já confirmados pelo usuário

---

### Atividades (`/atividades`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/atividades` | — | Lista atividades (DBE2) |
| `GET` | `/atividades/:id` | — | Detalhe |
| `GET` | `/atividades/:id/presencas` | admin | Presenças de uma atividade |
| `POST` | `/atividades` | admin | **BD2:** Cria atividade |
| `PUT` | `/atividades/:id` | admin | **BD2:** Atualiza atividade |
| `DELETE` | `/atividades/:id` | admin | **BD2:** Remove atividade |

**Query params:** `?busca=&tipo=&trilha=&evento_id=&sortBy=data&sortDir=asc&page=1&perPage=10`

Tipos aceitos: `palestra | oficina | mesa_redonda | minicurso`

---

### Palestrantes (`/palestrantes`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/palestrantes` | — | Lista com paginação e busca (DBE2) |
| `GET` | `/palestrantes/:id` | — | Detalhe |
| `POST` | `/palestrantes` | admin | **BD2:** Cria palestrante |
| `PUT` | `/palestrantes/:id` | admin | **BD2:** Atualiza |
| `DELETE` | `/palestrantes/:id` | admin | **BD2:** Remove |

**Query params:** `?busca=&area=&sortBy=nome&sortDir=asc&page=&perPage=`

---

### Locais (`/locais`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/locais` | — | Lista com paginação e busca (DBE2) |
| `GET` | `/locais/:id` | — | Detalhe |
| `POST` | `/locais` | admin | **BD2:** Cria local |
| `PUT` | `/locais/:id` | admin | **BD2:** Atualiza |
| `DELETE` | `/locais/:id` | admin | **BD2:** Remove |

**Query params:** `?busca=&tipo=&page=&perPage=`

Tipos aceitos: `sala | auditorio | laboratorio | externo`

---

### Inscrições (`/inscricoes`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/inscricoes` | admin | Lista todas com filtros e paginação (DBE2) |
| `GET` | `/inscricoes/:id` | ✔ | Detalhe |
| `POST` | `/inscricoes` | ✔ | **BD2:** Inscreve em uma atividade |
| `PUT` | `/inscricoes/:id` | admin | **BD2:** Atualiza status |
| `DELETE` | `/inscricoes/:id` | ✔ | **BD2:** Cancela inscrição |

**Exemplo — Inclusão BD2:**
```bash
POST /api/inscricoes
Authorization: Bearer <token>
Content-Type: application/json

{
  "atividade_id": 3,
  "nome_participante": "Ana Souza",
  "email": "ana@aluno.edu.br",
  "telefone": "(53) 99999-0000"
}
```

---

### Presenças (`/presencas`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/presencas` | ✔ | Registra presença em atividade |
| `DELETE` | `/presencas` | ✔ | Remove presença |

Body: `{ "atividade_id": 3 }`

---

### Admin — Usuários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/admin/usuarios` | admin | Lista usuários |
| `PATCH` | `/admin/usuarios/:id/role` | admin | Altera role (`aluno`, `professor`, `admin`) |
| `DELETE` | `/admin/usuarios/:id` | admin | Remove usuário |

---

### Health check

```bash
GET /api/health
# → { "status": "ok", "uptime": 42.5 }
```

---

## Frontend (eventus-ui)

O frontend Next.js consome esta API. Para conectar:

```env
# eventus-ui/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

**Páginas principais:**

| Rota | Descrição |
|------|-----------|
| `/` | Home com eventos em destaque |
| `/eventos` | Listagem com filtros, ordenação e paginação (DBE2) |
| `/eventos/:slug` | Detalhe: programação, palestrantes, oficinas, botão Confirmar Presença |
| `/login` | Autenticação |
| `/registro` | Cadastro de conta |
| `/admin` | Painel admin (somente role `admin`) |
| `/admin/eventos` | CRUD de eventos (BD2) |
| `/admin/eventos/novo` | Criar novo evento |
| `/admin/eventos/:id/editar` | Editar evento |
| `/admin/atividades` | Listagem de atividades com filtros e exclusão (BD2) |
| `/admin/atividades/nova` | Criar nova atividade |
| `/admin/palestrantes` | Listagem + criação inline de palestrantes (BD2) |
| `/admin/locais` | Listagem + criação inline de locais (BD2) |
| `/admin/inscricoes` | Listagem com filtros, paginação e exclusão (BD2 + DBE2) |

---

## Testes e qualidade

```bash
cd backend
npm run test:coverage   # gera coverage/lcov.info para o SonarQube
```

A suíte (37 testes) cobre o `queryBuilder` (paginação/filtros/ordenação), regras de negócio de inscrição e participação, CRUD de palestrantes e locais, e autenticação. O relatório `coverage/lcov.info` alimenta o SonarQube — ver [`docs/SONARQUBE.md`](docs/SONARQUBE.md).

---

## Segurança

- Senhas com **bcrypt** (salt rounds: 10)
- Tokens **JWT** com expiração configurável (`JWT_EXPIRES_IN`)
- `helmet` + `cors` configurados
- Validação de entrada com **Zod** em todos os services
- Middleware `requireAuth(roles)` protege rotas sensíveis
- Supabase acessa o banco via **Service Role Key** somente no servidor (nunca exposta ao browser)
# eventus-server
