
FROM node:18 AS builder
WORKDIR /repo

COPY . .
RUN mkdir -p client/dist

RUN if [ -f client/package.json ]; then       cd client && npm install --silent && npm run build;     else       echo "Skipping client build";     fi

FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package.json ]; then npm install --production --silent || npm install --production --silent; fi

COPY server.js .
COPY --from=builder /repo/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "server.js"]
