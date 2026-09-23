FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/hosts ./hosts
COPY --from=build /app/processes ./processes
RUN npm install -g @openai/codex
EXPOSE 3000
CMD ["node","dist/index.js"]
