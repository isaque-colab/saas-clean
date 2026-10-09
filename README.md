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

## Dados e autenticação

O cadastro deste protótipo é local ao navegador e não usa senha, servidor ou banco de dados. Os dados são guardados em `localStorage`, não sincronizam entre dispositivos e não devem conter informações financeiras reais. O botão de demonstração cria um perfil de exemplo local.

Para vender o produto ou criar contas reais, ainda é necessário implementar autenticação segura, API/backend, banco de dados, autorização por usuário e recuperação de senha. O HTML estático sozinho não fornece esses serviços.

## Deploy Netlify

O `netlify.toml` publica a raiz como site estático. Isso disponibiliza a landing e o protótipo; não transforma o cadastro local em autenticação de produção.
