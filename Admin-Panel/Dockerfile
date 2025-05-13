# Dockerfile pour l'Admin-Panel (React)

# Étape 1: Build de l'application React
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et les fichiers de lock (package-lock.json ou yarn.lock)
# Assurez-vous que les chemins sont corrects si le Dockerfile est à la racine de Admin-Panel
COPY package*.json ./
# Si vous utilisez yarn, copiez yarn.lock
# COPY yarn.lock ./

# Installer les dépendances
# Si vous utilisez npm :
RUN npm install
# Si vous utilisez yarn :
# RUN yarn install --frozen-lockfile

# Copier le reste du code source de l'Admin-Panel
COPY . .

# Construire l'application React pour la production
RUN npm run build
# Si vous utilisez yarn :
# RUN yarn build

# Étape 2: Servir les fichiers statiques avec un serveur web léger (Nginx)
FROM nginx:alpine

# Copier les fichiers de build de l'étape précédente dans le répertoire de Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# (Optionnel) Copier une configuration Nginx personnalisée si nécessaire
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port sur lequel Nginx écoute (par défaut 80)
# L'Admin-Panel pourrait être mappé sur un port comme 3002
EXPOSE 3002

CMD ["npm", "run", "dev"]

