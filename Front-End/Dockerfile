# Dockerfile pour le Front-End (Next.js)

# Étape 1: Build de l'application Next.js
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et les fichiers de lock (package-lock.json ou yarn.lock)
COPY package*.json ./
# Si vous utilisez yarn, copiez yarn.lock
# COPY Front-End/yarn.lock ./

# Installer les dépendances
# Si vous utilisez npm :
RUN npm install
# Si vous utilisez yarn :
# RUN yarn install --frozen-lockfile

# Copier le reste du code source du Front-End
COPY . .

# Construire l'application Next.js pour la production
RUN npm run build
# Si vous utilisez yarn :
# RUN yarn build

# Étape 2: Servir l'application Next.js optimisée
FROM node:18-alpine AS runner

WORKDIR /app

# Définir l'environnement en production
ENV NODE_ENV production

# Copier les fichiers de build de l'étape précédente
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exposer le port sur lequel l'application Next.js tourne (par défaut 3000)
EXPOSE 3000

# Commande pour démarrer le serveur Next.js en mode production
# Le port peut être spécifié via la variable d'environnement PORT ou -p
CMD ["node", "server.js"]

