# Dockerfile pour AI-Service (Python/Flask) - Optimisé pour une construction plus rapide

# Stage 1: Builder stage pour installer des dépendances lourdes
FROM python:3.9-slim as builder

# Définir les versions et URLs pour SonarScanner
ENV SONAR_SCANNER_VERSION="5.0.1.3006"
ENV SONAR_SCANNER_HOME="/opt/sonar-scanner"
ENV SONAR_SCANNER_DOWNLOAD_URL="https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux.zip"

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Installer les dépendances système nécessaires pour dlib et face_recognition
# Ajout de des outils de réseau pour surveiller le téléchargement
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de requirements
COPY requirements.txt .

# Mettre à jour pip et installer wheel pour des installations plus efficaces
RUN pip install --no-cache-dir --upgrade pip wheel setuptools

# Séparer l'installation des packages lourds pour éviter les timeouts
# 1. Installer d'abord dlib qui est critique
RUN pip install --no-cache-dir --timeout 300 dlib==19.24.0

# 2. Installer PyTorch avec un timeout plus long
RUN pip install --no-cache-dir --timeout 600 --extra-index-url https://download.pytorch.org/whl/cpu torch==2.0.1+cpu

# 3. Installer face_recognition qui dépend de dlib
RUN pip install --no-cache-dir --timeout 300 face_recognition==1.3.0 

# 4. Installer les bibliothèques restantes avec un timeout confortable
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt

# Stage 2: Image finale plus légère
FROM python:3.9-slim

WORKDIR /app

# Copier seulement les packages Python installés depuis le builder
COPY --from=builder /usr/local/lib/python3.9/site-packages/ /usr/local/lib/python3.9/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Installer les dépendances minimales pour l'exécution
RUN apt-get update && apt-get install -y \
    libopenblas-dev \
    libx11-dev \
    libgtk-3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copier le code de l'application
COPY . .

# Configurer les variables d'environnement
ENV PYTHONUNBUFFERED=1

# Exposer le port de l'application
EXPOSE 5001

# Commande pour démarrer l'application Flask
CMD ["python", "app.py"]

