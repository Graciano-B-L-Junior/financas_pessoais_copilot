FROM cgr.dev/chainguard/node:latest-dev AS deps

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY . .

FROM cgr.dev/chainguard/node:latest

WORKDIR /app

COPY --from=deps /app /app

EXPOSE 3000

ENTRYPOINT ["node", "src/server.js"]