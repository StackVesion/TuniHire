# Rapport Final : Gestion Sécurisée des Variables d'Environnement pour TuniHire

## Introduction

Ce document récapitule la stratégie mise en œuvre pour gérer de manière sécurisée les variables d'environnement et les secrets pour votre projet TuniHire dans le cadre du pipeline CI/CD avec Jenkins et Docker.

L'objectif principal est de protéger les informations sensibles (clés API, secrets JWT, mots de passe) en évitant de les stocker en clair dans le code source ou les fichiers de configuration versionnés.

## Stratégie Adoptée

Nous avons adopté une approche basée sur l'utilisation des **Jenkins Credentials** pour stocker les secrets, et leur injection sécurisée au moment du déploiement via Docker Compose.

1.  **Stockage des Secrets :** Toutes les variables sensibles sont stockées en tant que "Secret text" credentials dans Jenkins. Cela garantit qu'elles ne sont pas exposées dans le code.
2.  **Configuration Docker Compose :** Le fichier `docker-compose.yml` a été adapté pour que les services (notamment `tunihire_backend`) s'attendent à recevoir ces variables d'environnement. Les valeurs elles-mêmes ne sont pas présentes dans ce fichier ; il utilise la syntaxe `${VARIABLE_NAME}` pour indiquer que la valeur sera fournie au moment de l'exécution.
3.  **Injection via Jenkinsfile :** Le `Jenkinsfile` a été modifié pour utiliser le plugin "Credentials Binding". Dans l'étape de déploiement, un bloc `withCredentials` est utilisé pour récupérer les secrets depuis Jenkins et les exposer temporairement comme variables d'environnement. Ces variables sont ensuite utilisées par la commande `docker-compose up`, qui les substitue dans le fichier `docker-compose.yml`.
4.  **Variables Non Sensibles :** Les configurations non sensibles (comme les numéros de port, `NODE_ENV=production`, ou les URLs publiques comme `GITHUB_CALLBACK_URL` et `FRONTEND_URL` dans notre cas) sont définies directement dans le `Jenkinsfile` (en tant que variables d'environnement globales) ou dans le `docker-compose.yml`.

## Variables d'Environnement Gérées

### Secrets à Configurer dans Jenkins

Vous devez créer les "Secret text" credentials suivants dans votre instance Jenkins. Il est crucial d'utiliser les **IDs de credential** exacts comme listés ci-dessous, car ils sont référencés dans le `Jenkinsfile` :

*   `TUNNIHIRE_SESSION_SECRET` (Valeur : votre secret de session)
*   `TUNNIHIRE_OPENAI_API_KEY` (Valeur : votre clé API OpenAI)
*   `TUNNIHIRE_JWT_SECRET` (Valeur : `129a49a5-dda6-49f9-8b5f-86a39c5cd7d9`)
*   `TUNNIHIRE_GOOGLE_CLIENT_ID` (Valeur : votre Google Client ID)
*   `TUNNIHIRE_GOOGLE_CLIENT_SECRET` (Valeur : votre Google Client Secret)
*   `TUNNIHIRE_GITHUB_CLIENT_ID` (Valeur : votre GitHub Client ID)
*   `TUNNIHIRE_GITHUB_CLIENT_SECRET` (Valeur : votre GitHub Client Secret)
*   `TUNNIHIRE_EMAIL_USER` (Valeur : votre utilisateur email)
*   `TUNNIHIRE_EMAIL_PASSWORD` (Valeur : votre mot de passe email)
*   `TUNNIHIRE_EMAIL_APP_USER` (Valeur : votre utilisateur email applicatif)
*   `TUNNIHIRE_EMAIL_APP_PASSWORD` (Valeur : votre mot de passe email applicatif)

*(Consultez le guide `Turi_Guide_CI_CD_TuniHire.md` pour savoir comment créer des credentials dans Jenkins si nécessaire.)*

### Configurations Fixes (Non Secrètes)

Les variables suivantes ont été considérées comme des configurations fixes pour l'environnement CI/CD et sont définies soit dans le `Jenkinsfile` (bloc `environment`), soit directement dans le `docker-compose.yml` :

*   `MONGODB_URI`: `mongodb://tunihire_db:27017/tunihire_prod` (interne au réseau Docker)
*   `NODE_ENV`: `production` (pour les services Node.js)
*   `PORT` (pour le backend) : `5000`
*   `GITHUB_CALLBACK_URL`: `http://localhost:5000/auth/github/callback` (défini dans le `Jenkinsfile`)
*   `FRONTEND_URL`: `http://localhost:3000` (défini dans le `Jenkinsfile`)
*   `SMTP_PORT`: `587` (défini dans le `Jenkinsfile`)
*   `NEXT_PUBLIC_API_URL` (pour les frontends) : `http://localhost:5000` (exemple, à ajuster si besoin dans `docker-compose.yml`)
*   `REACT_APP_API_URL` (pour l'admin panel) : `http://localhost:5000` (exemple, à ajuster si besoin dans `docker-compose.yml`)

## Fichiers Modifiés

1.  **`docker-compose.yml` :**
    *   La section `environment` du service `tunihire_backend` a été mise à jour pour référencer les variables d'environnement qui seront injectées (par exemple, `JWT_SECRET: ${JWT_SECRET}`).
    *   Les URLs fixes y sont également définies.
2.  **`Jenkinsfile` :**
    *   Un bloc `withCredentials` a été ajouté à l'étape `Deploy Application` pour lier les credentials Jenkins aux variables d'environnement.
    *   Les URLs fixes (`GITHUB_CALLBACK_URL_CONFIG`, `FRONTEND_URL_CONFIG`, `SMTP_PORT_CONFIG`) sont définies dans le bloc `environment` global et exportées avant `docker-compose up`.

## Bonnes Pratiques et Maintenance

*   **Ne Jamais Commiter les Secrets :** Assurez-vous que votre fichier `.env` local (utilisé pour le développement) est bien listé dans votre fichier `.gitignore` et n'est jamais poussé sur votre dépôt Git.
*   **Mise à Jour des Secrets :** Si un secret doit être modifié (par exemple, rotation d'une clé API), mettez à jour sa valeur directement dans Jenkins Credentials. Aucune modification du `Jenkinsfile` ou du `docker-compose.yml` n'est nécessaire si l'ID du credential reste le même.
*   **Ajout de Nouveaux Secrets :** Si vous devez ajouter un nouveau secret pour le backend :
    1.  Créez un nouveau "Secret text" credential dans Jenkins avec un ID unique (par exemple, `TUNNIHIRE_NEW_SECRET`).
    2.  Ajoutez la référence `${NEW_SECRET}` dans la section `environment` du service `tunihire_backend` dans `docker-compose.yml`.
    3.  Ajoutez une ligne `string(credentialsId: 'TUNNIHIRE_NEW_SECRET', variable: 'NEW_SECRET')` dans le bloc `withCredentials` du `Jenkinsfile`.
*   **Audit Régulier :** Il est bon de revoir périodiquement les accès et les secrets configurés.

## Conclusion

Cette configuration assure une gestion robuste et sécurisée de vos variables d'environnement et de vos secrets pour le projet TuniHire. Elle sépare clairement la configuration de l'application des informations sensibles, ce qui est une pratique essentielle en matière de sécurité et de DevOps.

N'hésitez pas si vous avez d'autres questions ou si des ajustements sont nécessaires à l'avenir.

