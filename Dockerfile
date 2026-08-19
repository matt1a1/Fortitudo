FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN bash setup-codespace.sh \
  && npm install --prefix client \
  && npm run build --prefix client \
  && test -f client/dist/index.html

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.mjs"]
