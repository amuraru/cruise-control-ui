FROM node:26 AS base

WORKDIR /opt/cruise-control-ui
COPY package*.json ./
RUN npm install --global "npm@$(node -p 'require("./package.json").engines.npm')" --no-audit --no-fund
RUN npm ci
COPY . .
RUN npm run build

FROM nginx
COPY --from=base /opt/cruise-control-ui/dist/ /usr/share/nginx/html/
EXPOSE 80
