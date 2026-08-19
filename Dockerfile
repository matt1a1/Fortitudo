FROM node:20-bookworm-slim

WORKDIR /app

# Copy whole repo
COPY . .

# Prepare client sources from root pages + install + build
RUN bash setup-codespace.sh \
  && npm install --prefix client \
  && npm run build --prefix client \
  && test -f client/dist/index.html

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.mjs"]
