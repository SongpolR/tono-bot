# Use Debian slim (plays nicely with sharp)
FROM node:18-slim

# Set working dir
WORKDIR /app

# Copy only package files first (better cache)
COPY package*.json ./

# Install prod deps
RUN npm ci --omit=dev

# Copy the rest
COPY . .

# Security hardening (non-root)
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run listens on $PORT
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/server.js"]
