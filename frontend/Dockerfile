FROM node:20-alpine

WORKDIR /app

# Install dependencies first — layer caches unless package.json changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the production bundle.
COPY . .
RUN npm run build

# Serve the static build with Vite's preview server.
# In production you'd use nginx, but preview is fine for a prototype.
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
