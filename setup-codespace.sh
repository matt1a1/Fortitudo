#!/bin/bash
set -e
cd "$(dirname "$0")"

mkdir -p client/src/pages client/src/components/ui client/src/contexts client/src/lib server/chunks

# Restaura API se ainda estiver em chunks
if [ ! -f server/index.mjs ] && [ -d server/chunks ]; then
  cat server/chunks/part*.txt 2>/dev/null | base64 -d > server/index.mjs || true
fi

# Copia paginas da raiz legada se faltarem em client/
for f in LoginPage DashboardPage EstrangeiroFlow not-found; do
  if [ -f "${f}.tsx" ] && [ ! -f "client/src/pages/${f}.tsx" ]; then
    cp "${f}.tsx" "client/src/pages/${f}.tsx"
    echo "copied ${f}.tsx"
  fi
done

if [ -f SettingsContext.tsx ] && [ ! -f client/src/contexts/SettingsContext.tsx ]; then
  cp SettingsContext.tsx client/src/contexts/
fi
if [ -f SettingsPanel.tsx ] && [ ! -f client/src/components/SettingsPanel.tsx ]; then
  cp SettingsPanel.tsx client/src/components/
fi
if [ -f index.css ] && [ ! -f client/src/index.css ]; then
  cp index.css client/src/
fi
if [ -f card.tsx ] && [ ! -f client/src/components/ui/card.tsx ]; then
  mkdir -p client/src/components/ui
  cp card.tsx client/src/components/ui/
fi
if [ -f button.tsx ] && [ ! -f client/src/components/ui/button.tsx ]; then
  mkdir -p client/src/components/ui
  cp button.tsx client/src/components/ui/
fi
if [ -f utils.ts ] && [ ! -f client/src/lib/utils.ts ]; then
  mkdir -p client/src/lib
  cp utils.ts client/src/lib/
fi

echo "OK — estrutura pronta"
echo "Proximos comandos:"
echo "  npm run install:all"
echo "  node server/index.mjs &"
echo "  npm run dev --prefix client"
