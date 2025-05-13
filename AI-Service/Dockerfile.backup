# Dockerfile pour AI-Service (Python/Flask)

# Utiliser une image Python officielle comme base
FROM python:3.9-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le fichier des dépendances en premier pour profiter du cache Docker
COPY AI-Service/requirements.txt requirements.txt

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le code du module AI-Service dans le répertoire de travail
COPY AI-Service/ .

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

