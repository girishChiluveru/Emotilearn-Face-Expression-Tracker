FROM node:18-alpine

WORKDIR /app

# Install build dependencies if needed (e.g. for bcrypt, though prebuilt binaries are usually available)
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment to production by default
ENV NODE_ENV=production
ENV PORT=3000

# Run the server
CMD ["node", "server.js"]
