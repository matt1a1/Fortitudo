#!/bin/bash
set -e
cd "$(dirname "$0")"

mkdir -p client/src/pages client/src/components/ui client/src/contexts client/src/lib

# Garante server completo (so tenta curl se existir)
if [ ! -f server/index.mjs ] || [ "$(wc -l < server/index.mjs)" -lt 100 ]; then
  if command -v curl >/dev/null 2>&1; then
    echo "Baixando server/index.mjs completo..."
    curl -fsSL "https://raw.githubusercontent.com/matt1a1/Fortitudo/main/server/index.mjs" -o server/index.mjs
  else
    echo "AVISO: server/index.mjs incompleto e curl indisponivel"
  fi
fi

# Copia paginas da raiz (forca)
for f in LoginPage DashboardPage EstrangeiroFlow not-found; do
  if [ -f "${f}.tsx" ]; then
    cp -f "${f}.tsx" "client/src/pages/${f}.tsx"
    echo "copied pages/${f}.tsx"
  fi
done

if [ -f SettingsContext.tsx ]; then
  cp -f SettingsContext.tsx client/src/contexts/SettingsContext.tsx
  echo "copied contexts/SettingsContext.tsx"
fi
if [ -f SettingsPanel.tsx ]; then
  cp -f SettingsPanel.tsx client/src/components/SettingsPanel.tsx
  echo "copied components/SettingsPanel.tsx"
fi
if [ -f utils.ts ]; then
  cp -f utils.ts client/src/lib/utils.ts
  echo "copied lib/utils.ts"
fi
if [ -f card.tsx ]; then
  cp -f card.tsx client/src/components/ui/card.tsx
fi
if [ -f button.tsx ]; then
  cp -f button.tsx client/src/components/ui/button.tsx
fi

# CSS e vite: usa arquivos do repo; curl so se disponivel
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "https://raw.githubusercontent.com/matt1a1/Fortitudo/main/client/vite.config.ts" -o client/vite.config.ts || true
  curl -fsSL "https://raw.githubusercontent.com/matt1a1/Fortitudo/main/client/package.json" -o client/package.json || true
  curl -fsSL "https://raw.githubusercontent.com/matt1a1/Fortitudo/main/client/src/index.css" -o client/src/index.css || true
else
  echo "curl ausente — mantendo client/vite.config.ts, package.json e index.css do repo"
fi

echo ""
echo "OK — estrutura pronta"
echo "Proximos comandos:"
echo "  npm run install:all"
echo "  node server/index.mjs &"
echo "  npm run dev --prefix client"
