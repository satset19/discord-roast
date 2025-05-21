# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV PORT=8000

# Create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app
USER appuser

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

# Install node modules
COPY --chown=appuser:appuser package-lock.json package.json ./
RUN npm ci --production

# Copy application code
COPY --chown=appuser:appuser . .

# Final stage for app image
FROM base

# Copy built application
COPY --chown=appuser:appuser --from=build /app /app

# Install required system dependencies and tini for signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Use tini as init process
ENTRYPOINT ["/usr/bin/tini", "--"]

# Health check with retries
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f https://gentle-maryann-satset19-66462aec.koyeb.app/src/health || exit 1

# Start the server by default, this can be overwritten at runtime
EXPOSE 8000
CMD ["pm2-runtime", "src/index.js", "--name", "roaster", "--watch"]

