FROM node:20-bookworm-slim

WORKDIR /app

# Copy repo
COPY . .

# Ensure client source layout (no curl needed)
RUN mkdir -p client/src/pages client/src/components/ui client/src/contexts client/src/lib \
  && cp -f LoginPage.tsx client/src/pages/LoginPage.tsx \
  && cp -f DashboardPage.tsx client/src/pages/DashboardPage.tsx \
  && cp -f EstrangeiroFlow.tsx client/src/pages/EstrangeiroFlow.tsx \
  && cp -f not-found.tsx client/src/pages/not-found.tsx \
  && cp -f SettingsContext.tsx client/src/contexts/SettingsContext.tsx \
  && cp -f SettingsPanel.tsx client/src/components/SettingsPanel.tsx \
  && cp -f utils.ts client/src/lib/utils.ts \
  && (test -f button.tsx && cp -f button.tsx client/src/components/ui/button.tsx || true) \
  && (test -f card.tsx && cp -f card.tsx client/src/components/ui/card.tsx || true)

# Install + build frontend
WORKDIR /app/client
RUN npm install && npm run build && test -f dist/index.html

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.mjs"]
