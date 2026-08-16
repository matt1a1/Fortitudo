# Fortitude

Sistema de anotacoes com perfis protegidos por senha, abas, fluxo Estrangeiro e admin.

## Rodar no navegador (sem instalar nada no PC) — GitHub Codespaces

1. Abra este repositorio: https://github.com/matt1a1/Fortitudo
2. Clique em **Code** → aba **Codespaces** → **Create codespace on main**
3. Aguarde o ambiente abrir no browser
4. No terminal do Codespace, rode:

```bash
npm run install:all
node server/index.mjs &
npm run dev --prefix client
```

5. Quando aparecer a URL do Vite, clique em **Open in Browser** (porta 5173)

### Login

| Perfil | Senha |
|--------|--------|
| fortitudo | fortitudeomelhor68 |
| temperantia | temperantia42 |
| prudentia | prudentia15 |
| iustitia | iustitia73 |

Admin: digite `entradaADM` + Enter na tela de login → senha `Maraca`

## Estrutura

- `client/` — frontend Vite + React
- `server/index.mjs` — API Node (sem dependencias)
- `server/data/` — dados JSON (criado automaticamente)
