FROM node:24.20.0-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.20.0-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY scripts/backup-cms.mjs ./scripts/backup-cms.mjs
RUN mkdir -p /data && chown node:node /data
USER node
ENV CMS_DATA_DIR=/data PORT=8788
EXPOSE 8788
CMD ["node", "server/index.mjs"]
