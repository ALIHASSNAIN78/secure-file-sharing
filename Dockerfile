FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server ./server
COPY public ./public

RUN mkdir -p /app/data /app/certs && \
    openssl req -x509 -newkey rsa:2048 \
      -keyout /app/certs/key.pem \
      -out /app/certs/cert.pem \
      -days 825 -nodes \
      -subj "/CN=secure-file-sharing-lan/O=Local/L=LAN/C=US"

EXPOSE 3000

CMD ["node", "server/index.js"]
