# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build tools)
RUN npm ci

# Copy the rest of the application code (includes .env for Vite to read VITE_* vars)
COPY . .

# Build the Vite frontend and ESBuild server bundle
RUN npm run build

# Stage 2: Production environment (clean image — no .env, no source code, no devDeps)
FROM node:22-alpine AS production

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Copy ONLY built assets from builder stage (no .env, no source code)
COPY --from=builder /app/dist ./dist

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Expose port (Cloud Run sets process.env.PORT, defaults to 8080)
EXPOSE 8080

# Run the server
CMD ["npm", "run", "start"]
