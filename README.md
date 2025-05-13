# TuniHire

## Environment Setup

This project uses environment variables for configuration. To properly set up the project:

1. Copy `.env.example` to `.env` in the Back-end directory:
   ```
   cp Back-end/.env.example Back-end/.env
   ```

2. Fill in your actual secrets and API keys in the `.env` file. Never commit this file to version control.

3. For Docker Compose, you can either:
   - Pass environment variables directly when running docker-compose:
     ```
     export SESSION_SECRET=your-secret && export JWT_SECRET=your-jwt-secret && ... docker-compose up
     ```
   - Or create a `.env` file in the root directory with all required variables.

### Handling Secrets

For security reasons:
- Never commit secrets or API keys to version control
- Use environment variables or a secure vault/secret manager
- For CI/CD pipelines, use secure environment variables provided by your CI platform
- For local development, use a `.env` file (excluded from git)

### Required Environment Variables

- `PORT` - Backend server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret for session encryption
- `JWT_SECRET` - Secret for JWT token generation
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `EMAIL_USER` - SMTP email user
- `EMAIL_PASSWORD` - SMTP email password
- `EMAIL_APP_USER` - App email user
- `EMAIL_APP_PASSWORD` - App email password
- `SMTP_PORT` - SMTP port (default: 587)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:3000)
- `GITHUB_CALLBACK_URL` - GitHub OAuth callback URL

## Secrets Management in CI/CD

When deploying this application in a CI/CD pipeline, secrets need to be handled securely. Here are the recommended approaches:

### GitHub Actions

```yaml
# Example GitHub Actions workflow
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Set non-sensitive environment variables here
      NODE_ENV: production
    steps:
      # ... other steps ...
      - name: Build and deploy
        env:
          # Use GitHub Secrets for sensitive information
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          GITHUB_CLIENT_ID: ${{ secrets.GITHUB_CLIENT_ID }}
          GITHUB_CLIENT_SECRET: ${{ secrets.GITHUB_CLIENT_SECRET }}
          # ... other secrets ...
        run: |
          # Your build/deploy commands here
```

### Jenkins Pipeline

```groovy
// Example Jenkinsfile
pipeline {
    agent any
    
    environment {
        // Non-sensitive environment variables
        NODE_ENV = 'production'
        
        // Sensitive environment variables from Jenkins credentials
        // These are masked in logs and secure
        JWT_SECRET = credentials('jwt-secret')
        SESSION_SECRET = credentials('session-secret')
        OPENAI_API_KEY = credentials('openai-api-key')
        GOOGLE_CLIENT_ID = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret')
        GITHUB_CLIENT_ID = credentials('github-client-id')
        GITHUB_CLIENT_SECRET = credentials('github-client-secret')
    }
    
    stages {
        stage('Deploy') {
            steps {
                // Your deployment steps
                sh 'docker-compose up -d'
            }
        }
    }
}
```

### Security Best Practices for CI/CD

1. **Never commit secrets to your repository**
2. **Use credential stores** provided by your CI/CD platform (GitHub Secrets, Jenkins Credentials, etc.)
3. **Rotate secrets regularly** especially after suspected compromise
4. **Limit access** to who can view and manage secrets
5. **Use secret scanning** to prevent accidental commit of secrets (like GitHub Secret Scanning)
6. **Use least privilege** when setting up service accounts and API keys

### For Local Development

For local development, run the included script to create an environment file:

**PowerShell:**
```powershell
.\create-env.ps1
```

**Bash:**
```bash
bash ./create-env.sh
```

Then edit the generated `.env` file to add your actual secret values before running the application.