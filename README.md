# Fluxo

Landing page estática para o SaaS de finanças e controle financeiro da Fluxo.

## Como rodar localmente

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Deploy no Netlify

1. Conecte o repositório no Netlify.
2. Configure a pasta de publicação como a raiz do projeto.
3. Use a configuração presente em `netlify.toml`.
4. Faça o deploy.

## Estrutura

- `index.html` — landing page principal
- `styles.css` — visual dark/light
- `script.js` — tema e interações
- `netlify.toml` — configuração de deploy

## Observação

Este projeto foi estruturado como landing page estática para publicação em Netlify. A versão full SaaS com backend e autenticação pode ser adicionada em seguida.
