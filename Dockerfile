FROM node:26 AS base

WORKDIR /opt/cruise-control-ui
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx
COPY --from=base /opt/cruise-control-ui/dist/ /usr/share/nginx/html/
EXPOSE 80
