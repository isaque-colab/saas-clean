# MEMORY

## Projeto
Fluxo é um protótipo navegável de SaaS financeiro com landing page e área demonstrativa.

## Estado atual
- Landing page estática pronta para Netlify.
- Painel com dashboard, lançamentos, orçamentos, metas, relatórios e configurações.
- Cadastro/login online integrado a Supabase Auth e persistência em Postgres com RLS, condicionado a configuração do projeto Supabase e variáveis no Netlify.
- Modo de demonstração separado usando `localStorage`; não é autenticação de produção e não deve receber dados reais.
- Tema dark/light.
- Configuração de deploy em `netlify.toml`.

## Arquivos principais
- `index.html`: página principal
- `styles.css`: visual e responsividade
- `script.js`: comportamento interativo
- `netlify.toml`: configuração do Netlify
- `netlify/functions/supabase-config.js`: publica somente a URL e a chave pública configuradas no ambiente Netlify
- `supabase/schema.sql`: tabelas financeiras, políticas RLS e inclusão idempotente na publicação Realtime
- `.env.example`: nomes das variáveis para desenvolvimento local
- `README.md`: instruções de uso

## Como testar localmente
```bash
python -m http.server 8090
```
Acesse `http://localhost:8090`.

## Observações
- Configure `SUPABASE_URL` e `SUPABASE_ANON_KEY` no Netlify e execute/reexecute `supabase/schema.sql` para criar tabelas e habilitar RLS + Realtime.
- Nunca colocar chave `service_role` ou outros segredos no cliente.
- Sem Supabase configurado, o site oferece somente demonstração local.
