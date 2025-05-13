FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install build dependencies for Alpine
RUN apk --no-cache add --virtual builds-deps build-base python3 make g++

# Copy package.json and package-lock.json separately first for better layer caching
COPY ./Back-end/package*.json ./

# First install regular dependencies
RUN npm install --omit=dev

# Then remove any pre-compiled bcrypt and install it from source
RUN npm uninstall --no-save bcrypt || true
RUN npm install --no-save bcrypt --build-from-source

# Set non-sensitive environment variables
ENV NODE_ENV=development 
ENV PORT=5000
ENV MONGO_URI=mongodb://tunihire_db:27017/tunihire_prod
ENV GITHUB_CALLBACK_URL="http://localhost:5000/auth/github/callback"
ENV FRONTEND_URL="http://localhost:3000"
ENV SMTP_PORT="587"

# Copy the rest of the application
COPY ./Back-end .

# Use node directly to start the server
CMD ["node", "server.js"]
