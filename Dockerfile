FROM node:18-alpine

# Create app dir
WORKDIR /app

# Install build dependencies for native modules if needed, then remove
RUN apk add --no-cache python3 make g++ \
  && npm config set fund false

# Copy package files and install (use npm ci if you have package-lock.json)
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY src/ ./src
COPY README.md ./README.md

# Clean up build deps to keep image small
RUN apk del python3 make g++ || true

# Use PORT env set by Fly (fallback to 8080)
ENV PORT 8080
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]