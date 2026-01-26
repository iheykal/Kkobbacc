# Simple Dockerfile for Render deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Provide a dummy MONGODB_URI for build time (will be overridden at runtime)
ENV MONGODB_URI="mongodb://dummy:27017/dummy"

# Build the application
RUN rm -rf src/app/test-* src/app/debug-*
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx next start -p ${PORT:-3000} -H 0.0.0.0"]