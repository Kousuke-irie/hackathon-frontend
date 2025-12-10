FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-timeout 60000 && \
    npm config set cache /tmp/npm_cache
RUN npm install --legacy-peer-deps
COPY . .
# Viteのデフォルトポート
EXPOSE 5173
# ホストからのアクセスを許可するために --host をつける
CMD ["npm", "run", "dev", "--", "--host"]