# Dockerfile pour AI-Service (Python/Flask)

# Utiliser une image Python officielle comme base
FROM python:3.9-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Mettre à jour l'OS et installer les dépendances système nécessaires
# - build-essential: pour les outils de compilation C/C++
# - cmake: requis par dlib et d'autres paquets
# - libboost-python-dev: souvent requis par dlib pour les bindings Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libboost-python-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier des dépendances en premier pour profiter du cache Docker
# Contexte de build est AI-Service/, donc requirements.txt est à la racine du contexte
COPY requirements.txt .

# Créer un virtualenv pour isoler les dépendances et éviter les problèmes de permission
RUN python -m venv /opt/venv

# Activer le virtualenv et installer les dépendances Python
# Utiliser --no-cache-dir peut être utile pendant le débogage.
RUN . /opt/venv/bin/activate && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier tout le code du module AI-Service dans le répertoire de travail
# Contexte de build est AI-Service/, donc copier tout depuis la racine du contexte
COPY . .

# S'assurer que le virtualenv est utilisé pour les commandes suivantes
ENV PATH="/opt/venv/bin:$PATH"

# Exposer le port sur lequel l'application Flask tourne (par exemple 5001 ou ce qui est défini dans app.py)
# Vérifiez le port utilisé par votre app.py
EXPOSE 5001

# Commande pour démarrer l'application Flask
# Assurez-vous que votre app.py est configuré pour écouter sur 0.0.0.0
# et que le port correspond à celui exposé.
# Par exemple, si vous utilisez gunicorn :
# CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
# Ou si vous lancez directement avec python (pour développement/tests, gunicorn est mieux pour la prod) :
CMD ["python", "app.py"]

