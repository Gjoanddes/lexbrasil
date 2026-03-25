# ⚖️ LEXBRASIL — Sistema Jurídico Integrado

Sistema online onde **você é o admin**: você atualiza as novidades e **todos os visitantes veem automaticamente**.

---

## 🗂️ Estrutura do projeto

```
lexbrasil/
├── public/
│   ├── index.html      ← Site principal (todos acessam)
│   └── admin.html      ← Painel admin (só você acessa)
├── api/
│   ├── novidades.js    ← Endpoint público: lê novidades do banco
│   └── admin-atualizar.js ← Endpoint privado: IA busca e salva novidades
├── vercel.json         ← Configuração do deploy
└── package.json
```

---

## 🚀 Deploy em 3 passos (tudo grátis)

### PASSO 1 — Criar banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta grátis
2. Crie um **New Project** (anote a senha do banco)
3. Vá em **SQL Editor** e execute:

```sql
CREATE TABLE novidades (
  id SERIAL PRIMARY KEY,
  tipo TEXT,
  fonte TEXT,
  titulo TEXT,
  descricao TEXT,
  impacto TEXT,
  data_aproximada TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meta (
  chave TEXT PRIMARY KEY,
  valor TEXT
);
```

4. Vá em **Settings → API** e anote:
   - `Project URL` → será o `SUPABASE_URL`
   - `anon public` key → será o `SUPABASE_ANON_KEY`
   - `service_role` key → será o `SUPABASE_SERVICE_KEY`

---

### PASSO 2 — Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta grátis (pode usar o GitHub)
2. Clique em **Add New Project → Upload** e faça upload desta pasta
3. Vá em **Settings → Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | https://xxxx.supabase.co |
| `SUPABASE_ANON_KEY` | eyJ... (chave anon) |
| `SUPABASE_SERVICE_KEY` | eyJ... (chave service_role) |
| `ADMIN_SENHA` | uma senha forte que só você sabe |

4. Clique em **Deploy** — em 1 minuto seu site estará online!

---

### PASSO 3 — Usar o sistema

**Para você (admin):**
- Acesse `https://seu-site.vercel.app/admin.html`
- Informe a senha admin e sua API key Anthropic
- Clique em **Buscar Novidades** → a IA pesquisa e publica para todos

**Para todos os visitantes:**
- Acessam `https://seu-site.vercel.app`
- Clicam em 🔔 **Novidades** para ver as últimas atualizações
- Podem analisar qualquer norma ou súmula com IA (usando a própria chave)
- **Não precisam de nenhuma configuração**

---

## 💡 Dicas

- **Quando atualizar?** Quando sair algo importante do STF/STJ ou uma nova lei. Você decide a frequência.
- **Compartilhar o link:** mande o link do site uma vez para as pessoas — elas salvam nos favoritos e sempre terão a versão atualizada.
- **API key Anthropic:** obtenha grátis em [console.anthropic.com](https://console.anthropic.com)
- **Custo:** Vercel (grátis), Supabase (grátis), Anthropic (cobra por uso — em média R$ 0,20 a R$ 0,50 por busca de novidades)

---

## 🔒 Segurança

- A senha admin nunca fica no código — só nas variáveis de ambiente do Vercel
- A chave `service_role` do Supabase só é usada no servidor (nunca exposta no navegador)
- Visitantes só têm acesso de leitura ao banco

---

Feito com ⚖️ para o direito brasileiro.
