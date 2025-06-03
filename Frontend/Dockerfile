# ─── Stage 1: Build the React+Vite app ───────────────────────────────────
FROM node:18 AS builder
WORKDIR /app

# 1) Copy package.json & package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# 2) Copy rest of the source files, then build
COPY . .
RUN npm run build

# ─── Stage 2: Serve the compiled output with Nginx ──────────────────────
FROM nginx:alpine
# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite default nginx config (if you have custom routes/headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (optional—docker-compose can map it)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
