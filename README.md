# Vibes Ponto ⏱️

Sistema interno de controle de ponto da **Vibes**. Todo colaborador registra
entrada e saída e consulta seu histórico; administradores ainda gerenciam
usuários, relatórios e configurações.

O acesso é por **e-mail e senha** (Supabase Auth — a senha nunca é armazenada
pela aplicação), e as permissões são controladas por um **RBAC centralizado**.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS v4** + **shadcn/ui** (dark mode incluso)
- **Supabase** — Auth (e-mail + senha) + PostgreSQL
- **Prisma** — ORM
- **React Hook Form** + **Zod** — formulários e validação

## Funcionalidades

**Autenticação**
- Tela inicial com **Entrar** e **Criar conta**
- Cadastro: nome, e-mail, senha e confirmação — com login automático ao final
- Login com **mostrar/ocultar senha**, **Lembrar-me** e **Esqueci minha senha**
- Recuperação de senha por link enviado ao e-mail
- Sessão persistente (sobrevive ao atualizar a página) e logout completo
- Validações: campos obrigatórios, formato de e-mail, senha de no mínimo 8
  caracteres, confirmação idêntica e e-mails únicos
- Usuários **desativados** não conseguem entrar, mesmo com a senha correta

**Todo colaborador (inclusive administradores)**
- Dashboard com saudação, relógio ao vivo, status do dia, entrada, saída e
  horas trabalhadas
- Botão inteligente: alterna entre "Registrar Entrada" e "Registrar Saída"
- Histórico próprio com total de horas — nunca vê dados de terceiros
- Perfil: editar dados pessoais e alterar a senha

**Administrador (além do acima)**
- Painel com indicadores: total de colaboradores, administradores,
  funcionários, presentes hoje, ausentes e novos usuários
- Últimos registros e usuários recém cadastrados
- **Gerenciar Usuários**: criar, editar, alterar tipo, ativar/desativar,
  excluir, pesquisar e filtrar
- Relatórios: todos os registros com pesquisa e filtro por data
- Configurações: matriz de permissões e parâmetros do sistema

## Pré-requisitos

- Node.js 20+
- Uma conta no [Supabase](https://supabase.com) (plano gratuito é suficiente)

## Instalação

### 1. Clone e instale as dependências

```bash
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie um
   novo projeto (anote a senha do banco).
2. Em **Project Settings → API**, copie a `URL`, a `anon key` e a
   `service_role key`.
3. Em **Project Settings → Database → Connection string**, copie as strings
   de conexão (pooling na porta `6543` e direta na porta `5432`).

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com os valores do passo anterior:

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role — usada só no servidor, no cadastro |
| `DATABASE_URL` | Conexão com pooling (porta 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Conexão direta (porta 5432) |

### 4. Crie as tabelas e defina os administradores

```bash
npm run db:push   # cria as tabelas users e time_records
npm run db:seed   # marca quais e-mails entram como ADMIN
```

Os administradores são definidos em [prisma/seed.ts](prisma/seed.ts) — ajuste
a lista com os e-mails desejados. Ao criarem a conta com o mesmo e-mail, o
perfil é reaproveitado e o papel de ADMIN é preservado. Rode o seed novamente
a qualquer momento para promover mais alguém (o script é idempotente).

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e clique em
**Criar conta**. Quem não estiver na lista de admins entra como FUNCIONARIO.

> **Sobre e-mail:** cadastro e login **não** enviam e-mail — funcionam
> offline do ponto de vista de e-mail. Apenas a recuperação de senha envia
> um link. O mailer embutido do Supabase é limitado a poucos e-mails por
> hora; para uso intenso, conecte um SMTP próprio em
> **Project Settings → Auth → SMTP**.

## Estrutura de pastas

```
app/
  (protected)/          # rotas autenticadas (header + sidebar)
    dashboard/          # dashboard pessoal — todos batem ponto aqui
    historico/          # histórico próprio
    perfil/             # dados pessoais + alterar senha
    admin/              # painel do administrador (indicadores)
    usuarios/           # gerenciar usuários (CRUD)
    relatorios/         # todos os registros de ponto
    configuracoes/      # matriz de permissões e parâmetros
  api/
    auth/               # signup, login, forgot-password
    profile/            # PATCH perfil próprio + /password
    users/              # POST criar | [id] PATCH/DELETE (admin)
    time-records/       # POST — registra entrada/saída
  auth/callback/        # GET — troca o link de e-mail por sessão
  login/ cadastro/ esqueci-senha/ redefinir-senha/
  page.tsx              # tela inicial (Entrar / Criar conta)
components/
  ui/                   # componentes base (button, card, dialog, select...)
  auth/                 # formulários de auth, guards, campo de senha
  layout/               # header, sidebar e menu mobile
  users/                # tabela e formulário de usuários
  profile/              # formulários do perfil
  filters/              # busca + filtros reutilizáveis
lib/
  rbac/
    permissions.ts      # ★ fonte única: papéis, permissões e can()
    routes.ts           # mapa rota → permissão
    navigation.ts       # menu derivado das permissões
  supabase/             # clients (browser, server, admin, middleware)
  auth.ts               # getCurrentProfile, requireUser, requirePermission
  api-auth.ts           # authorize() — proteção das rotas de API
  records.ts            # serialização e totais de ponto
  prisma.ts  time.ts  validations.ts
prisma/
  schema.prisma         # modelos Profile e TimeRecord
  migrations/           # SQL da migração users → profiles
  seed.ts               # define os e-mails com papel de admin
middleware.ts           # sessão + rotas públicas
```

## Modelo de dados

- **profiles** — `id`, `nome`, `email` (único), `role` (`admin` |
  `employee`), `status` (`active` | `inactive`), `avatar_url`, `cargo`,
  `departamento`, `created_at`, `updated_at`
- **time_records** — `id`, `profile_id`, `entrada`, `saida` (nullable),
  `created_at`

> A **senha não fica aqui**: o hash é responsabilidade do Supabase Auth
> (`auth.users`). O perfil é resolvido pelo e-mail da sessão, então o `id`
> do perfil é independente do id de `auth.users`.

## Permissões (RBAC)

Toda a autorização nasce de **um único arquivo**:
[lib/rbac/permissions.ts](lib/rbac/permissions.ts). Não existe
`if (role === "admin")` espalhado pelo código — sempre se pergunta por uma
**permissão**:

```ts
can(profile.role, "user:create")        // checagem booleana
await requirePermission("user:read")    // páginas (redireciona)
await authorize("user:delete")          // rotas de API (401/403)
<PermissionGuard permission="user:create"> // esconde interface
```

### Adicionar um novo perfil (RH, Supervisor, Gestor)

1. Inclua o valor no enum `Role` em [prisma/schema.prisma](prisma/schema.prisma)
   e rode `npm run db:push`.
2. Declare as permissões dele em `ROLE_PERMISSIONS`.

Só isso. Menus, rotas, telas e APIs se ajustam sozinhos — e o TypeScript
**quebra o build** se o novo papel ficar sem permissões declaradas
(`Record<Role, ...>` exige uma entrada por papel).

### Camadas de proteção

| Camada | Onde | O que faz |
| --- | --- | --- |
| Sessão | `middleware.ts` | Sem login → `/login` |
| Página | `requirePermission()` | Sem permissão → `/dashboard` |
| **API** | `authorize()` | Sem permissão → **403** |
| Interface | `PermissionGuard` | Esconde o que não pode ser usado |

A interface **nunca** é a proteção: mesmo chamando as APIs direto pelo
console, um funcionário recebe 403.

## Como funciona a autenticação

1. **Cadastro** → `POST /api/auth/signup` cria a conta no Supabase Auth (com
   `email_confirm`, para não depender de e-mail), cria o perfil em `profiles`
   como `employee` e já autentica — a sessão vai para cookies httpOnly.
2. **Login** → `POST /api/auth/login` valida e-mail/senha no Supabase Auth.
   `Lembrar-me` desmarcado grava cookies de sessão (some ao fechar o
   navegador); marcado mantém o login.
3. **Sessão** → o middleware revalida e renova a sessão a cada request, o que
   mantém o usuário logado ao atualizar a página.
4. **Recuperação** → `POST /api/auth/forgot-password` envia o link; ao abri-lo,
   `/auth/callback` troca o código por uma sessão temporária e leva para
   `/redefinir-senha`, onde a nova senha é definida.

> **Cadastro aberto:** qualquer pessoa com o link pode criar conta (entra como
> `employee`). Para restringir a domínios da empresa, valide o e-mail em
> `app/api/auth/signup/route.ts`. Alternativa: desativar o cadastro público e
> criar todos os usuários pela tela **Gerenciar Usuários**.

## Decisões de arquitetura

- **Um registro por dia**: o clock-in cria o registro com `entrada`; o
  clock-out preenche `saida` no mesmo registro. O estado do botão deriva do
  registro do dia (sem registro → entrada; entrada aberta → saída; completo →
  encerrado).
- **Fuso horário fixo** `America/Sao_Paulo` (UTC-3, sem horário de verão
  desde 2019) para definir o "dia" dos registros, independentemente do fuso
  do servidor.
- **O administrador também é colaborador**: bate ponto no mesmo
  `/dashboard` que todo mundo e acumula as permissões de gestão — por isso o
  papel `admin` herda as permissões de colaborador no RBAC.
- **Autorização no servidor**: middleware garante sessão; `requirePermission`
  protege páginas e `authorize` protege as APIs. O Prisma acessa o banco pela
  conexão direta, então toda regra de acesso é aplicada na aplicação.
- **Guarda-corpos de gestão**: ninguém altera o próprio papel/status nem
  exclui a própria conta, e o sistema impede ficar sem administrador ativo.
- **Leituras via Server Components** (Prisma direto) e **mutação via Route
  Handler** — menos código, tipagem de ponta a ponta.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servir build de produção |
| `npm run db:push` | Sincroniza o schema Prisma com o banco |
| `npm run db:seed` | Cria usuários de teste |
| `npm run db:generate` | Gera o Prisma Client |
