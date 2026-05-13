FROM node:22-alpine

# Install system deps
RUN apk add --no-cache curl ca-certificates bash

# Install OpenClaw
RUN npm install -g openclaw@latest && npm cache clean --force

# Lock down npm global installs — remove npm/npx binaries after use
RUN rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Add openclaw wrapper that intercepts 'update' subcommand
RUN mv /usr/local/bin/openclaw /usr/local/bin/openclaw-real
COPY openclaw-wrapper.sh /usr/local/bin/openclaw
RUN chmod +x /usr/local/bin/openclaw

# Set env
ENV NODE_ENV=production
ENV OPENCLAW_HOME=/root/.openclaw

# Create workspace dir
RUN mkdir -p /root/.openclaw/workspace

# Expose gateway port
EXPOSE 18789

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:18789/ || exit 1

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
