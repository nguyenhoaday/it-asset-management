FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Script khởi động để inject VITE_API_BASE_URL vào runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
