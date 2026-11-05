# A self-contained test image: Playwright's image + this project's tests baked in.
# Build:  docker build -t release-radar-tests .
# Run:    docker run --rm --ipc=host release-radar-tests
FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

# Dependencies first, so this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Then the app and tests (changes often, cheap layer)
COPY . .
RUN chown -R pwuser:pwuser /app
USER pwuser

CMD ["npx", "playwright", "test"]
