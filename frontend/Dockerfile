# build stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# serve stage
FROM caddy:alpine as serve-stage
WORKDIR /app
COPY --from=build-stage /app/dist /app
COPY Caddyfile /app
EXPOSE 5173
CMD ["caddy", "run"]
