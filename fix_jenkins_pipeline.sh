#!/bin/bash

# Script to fix Jenkins pipeline issues
# Run this script from the TuniHire project root directory

# Check if we're in the right directory
if [ ! -f "jenkinsfile" ]; then
    echo "Error: jenkinsfile not found in the current directory."
    echo "Please run this script from the TuniHire project root directory."
    exit 1
fi

# Create a backup of the current jenkinsfile
BACKUP_FILE="jenkinsfile.backup.$(date +%Y%m%d%H%M%S)"
cp jenkinsfile "$BACKUP_FILE"
echo "Created backup: $BACKUP_FILE"

# Fix 1: Reduce SonarQube quality gate timeout from 5 to 1 minute
sed -i 's/timeout(time: 5, unit:/timeout(time: 1, unit:/g' jenkinsfile
echo "Reduced SonarQube quality gate timeout from 5 to 1 minute"

# Fix 2: Update SonarQube scanner command for Admin-Panel to include exclusions
# This will add exclusion patterns to avoid language detection conflicts
sed -i '/MODULE_DIR = "Admin-Panel"/,/withSonarQubeEnv/ s|\("${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"\)|\1 -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**"|' jenkinsfile
echo "Added exclusion patterns for Admin-Panel SonarQube analysis"

# Fix 3: Create or update sonar-project.properties for Admin-Panel
if [ -d "Admin-Panel" ]; then
    cat > Admin-Panel/sonar-project.properties << 'EOL'
# SonarQube properties for Admin-Panel module
sonar.projectKey=TuniHire_AdminPanel
sonar.projectName=TuniHire Admin Panel
sonar.sources=src

# Exclude files causing language detection conflicts
sonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**

# Language configuration to avoid conflicts
sonar.typescript.file.suffixes=.ts,.tsx
sonar.javascript.file.suffixes=.js,.jsx

# Coverage settings
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info
EOL
    echo "Created/updated sonar-project.properties for Admin-Panel"
else
    echo "Warning: Admin-Panel directory not found. Skipping sonar-project.properties creation."
fi

echo "Done! All fixes have been applied."
echo "To run the pipeline, make sure to:"
echo "1. Set SKIP_SONAR=false to verify the SonarQube fixes"
echo "2. Set SKIP_DOCKER_BUILD_PUSH=true and SKIP_DEPLOY=true to focus on CI stages"
