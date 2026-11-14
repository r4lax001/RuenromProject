FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm install
COPY client client
RUN npm run build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm install --omit=dev
COPY server server
COPY --from=build /app/client/dist client/dist
RUN mkdir -p /app/server/uploads && chown -R node:node /app/server/uploads
USER node
EXPOSE 3000
CMD ["npm","start"]