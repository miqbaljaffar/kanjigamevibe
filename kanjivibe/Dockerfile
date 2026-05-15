# Stage 1: Build the application
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package management files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Vite frontend and ESBuild server bundle
RUN pnpm run build

# Stage 2: Production environment
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package management files
COPY package.json pnpm-lock.yaml* ./

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose port (Cloud Run sets process.env.PORT, defaults to 8080)
EXPOSE 8080

# Run the server
CMD ["pnpm", "run", "start"]
