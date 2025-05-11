# Étape 1: Base avec Node.js (version correspondant à votre projet, ex: 18-alpine pour la légèreté)
FROM node:18-alpine AS base

# Définir le répertoire de travail
WORKDIR /usr/src/app

# Copier package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Étape 2: Installer les dépendances de production
FROM base AS prod-deps
RUN npm ci --omit=dev

# Étape 3: Copier le code source et construire l'image finale
FROM base AS final

# Copier les dépendances de production de l'étape précédente
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules

# Copier le reste des fichiers de l'application
COPY . .

# (Optionnel) Si votre application a une étape de build (ex: TypeScript)
# RUN npm run build

# Exposer le port sur lequel l'application backend tourne (doit correspondre à votre app)
# Assurez-vous que votre application écoute sur 0.0.0.0 et le port spécifié
EXPOSE 5000

# Commande pour démarrer l'application
# Assurez-vous que le script 'start' dans package.json est configuré pour la production
CMD [ "npm", "start" ]
