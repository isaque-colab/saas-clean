# MEMORY

## Projeto
Fluxo é um protótipo navegável de SaaS financeiro com landing page e área demonstrativa.

## Estado atual
- Landing page estática pronta para Netlify.
- Painel demonstrativo com dashboard, lançamentos, orçamentos, metas, relatórios e configurações.
- Cadastro/login de demonstração e dados locais em `localStorage`; não é autenticação de produção.
- Tema dark/light.
- Configuração de deploy em `netlify.toml`.

## Arquivos principais
- `index.html`: página principal
- `styles.css`: visual e responsividade
- `script.js`: comportamento interativo
- `netlify.toml`: configuração do Netlify
- `README.md`: instruções de uso

## Como testar localmente
```bash
python -m http.server 8090
```
Acesse `http://localhost:8090`.

## Observações
- Não inserir dados financeiros reais no protótipo local.
- Para contas reais e sincronização multi-dispositivo, implementar backend, autenticação segura e banco de dados.
