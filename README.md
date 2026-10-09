# Fluxo

Protótipo navegável de um SaaS de finanças, com landing page e área demonstrativa para gestão financeira.

## Executar localmente

Requer Python 3 instalado. Na pasta do projeto, execute:

```powershell
python -m http.server 8090
```

Abra `http://localhost:8090` no navegador.

## Telas

- Landing page e preços
- Cadastro e login demonstrativos
- Visão geral do fluxo financeiro
- Lançamentos com inclusão, busca e remoção
- Orçamentos por categoria
- Metas financeiras
- Relatórios e configurações
- Tema claro/escuro

## Ativar contas reais

O cadastro real usa Supabase Auth e Postgres. A chave pública Supabase é entregue ao navegador por uma função Netlify; o acesso aos dados é limitado com Row Level Security (RLS). Nunca configure uma chave `service_role` no navegador ou neste site.

1. Crie um projeto no Supabase.
2. Abra o SQL Editor no Supabase e execute `supabase/schema.sql` para criar as tabelas, políticas RLS e habilitar Realtime. Se já executou o arquivo antes, execute-o novamente para adicionar as tabelas existentes à publicação `supabase_realtime`; o script usa verificações idempotentes.
3. No Netlify, abra Site configuration → Environment variables e cadastre `SUPABASE_URL` e `SUPABASE_ANON_KEY` usando os valores do projeto Supabase. A chave anon/publishable é pública por natureza; RLS protege os dados. Nunca use `service_role`.
4. No Supabase Authentication → URL Configuration, defina o URL de produção do Netlify como Site URL e adicione o URL local `http://localhost:8888` e o domínio de produção em Redirect URLs.
5. Ative a confirmação de e-mail. Para produção, configure SMTP próprio para que confirmações e recuperação de senha cheguem de forma confiável.
6. Faça um novo deploy no Netlify para as variáveis serem carregadas.

Para desenvolvimento local, copie `.env.example` para `.env`, preencha os valores do seu projeto Supabase e execute `netlify dev`. Abra `http://localhost:8888`; o servidor Python sozinho não executa as funções Netlify.

O botão de demonstração continua disponível sem configuração, mas seus dados ficam apenas no navegador e não são uma conta real. Não use dados financeiros reais na demonstração.

## Deploy Netlify

O `netlify.toml` publica a raiz e as funções em `netlify/functions`. A criação de contas fica indisponível até que o projeto Supabase, o SQL e as variáveis acima sejam configurados.
