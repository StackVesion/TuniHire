# Dockerfile pour le Company-Panel (Next.js)

# Étape 1: Build de l'application Next.js
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et les fichiers de lock (package-lock.json ou yarn.lock)
# Assurez-vous que les chemins sont corrects si le Dockerfile est à la racine de Company-Panel
COPY package*.json ./
# Si vous utilisez yarn, copiez yarn.lock
# COPY yarn.lock ./

# Installer les dépendances
# Si vous utilisez npm :
RUN npm install
# Si vous utilisez yarn :
# RUN yarn install --frozen-lockfile

# Copier le reste du code source du Company-Panel
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

# Exposer le port sur lequel l'application Next.js tourne (par défaut 3000, mais Company-Panel pourrait utiliser 3001)
# Vérifiez le port utilisé par Company-Panel et ajustez si nécessaire
EXPOSE 3001

# Commande pour démarrer le serveur Next.js en mode production
# Le port peut être spécifié via la variable d'environnement PORT ou -p
# Si Company-Panel utilise un port différent, par exemple 3001, vous pouvez le spécifier ici
# CMD ["node", "server.js", "-p", "3001"]
# Ou si server.js lit la variable PORT:
# ENV PORT 3001
CMD ["node", "server.js"]

