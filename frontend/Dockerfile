# build stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# serve stage
FROM caddy:2.8.4 as serve-stage
WORKDIR /app
COPY --from=build-stage /app/dist /var/www/html
CMD ["caddy", "run"]
