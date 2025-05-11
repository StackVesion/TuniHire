#!/bin/bash

# Fix for SonarQube configuration in jenkinsfile
# This script applies various fixes to the SonarQube configuration
# Run this script from the TuniHire root directory

echo "Fixing SonarQube configuration in jenkinsfile"

# Make a backup of the jenkinsfile before making changes
cp jenkinsfile jenkinsfile.backup.$(date +%Y%m%d%H%M%S)
echo "Created backup: jenkinsfile.backup.$(date +%Y%m%d%H%M%S)"

# Since SonarQube scanner tool is already configured as 'scanner', we don't need to change the tool name

# Replace timeout values for quality gate to avoid waiting too long
sed -i "s/timeout(time: 5, unit: 'MINUTES')/timeout(time: 1, unit: 'MINUTES')/g" jenkinsfile

# Add specific SonarQube configurations for each module to fix language detection conflicts
# Fix for Admin-Panel module - explicitly exclude css.d.ts to avoid language detection conflict
sed -i '/MODULE_DIR = "Admin-Panel"/,/stage('\''SonarQube Analysis'\'')/ s|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**"|' jenkinsfile

# Fix for Front-End module - add language pattern configs
sed -i '/MODULE_DIR = "Front-End"/,/stage('\''SonarQube Analysis'\'')/ s|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"|' jenkinsfile

# Fix for Company-Panel module - add exclusions
sed -i '/MODULE_DIR = "Company-Panel"/,/stage('\''SonarQube Analysis'\'')/ s|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=node_modules/**,.next/**"|' jenkinsfile

# Fix for Back-End module - add exclusions
sed -i '/MODULE_DIR = "Back-End"/,/stage('\''SonarQube Analysis'\'')/ s|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"|sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=node_modules/**"|' jenkinsfile

# Fix the message in AI-Service Quality Gate section
sed -i 's|echo "SonarQube Quality Gate for ${MODULE_NAME} skipped in Docker agent"|echo "SonarQube Quality Gate for ${MODULE_NAME} skipped"|' jenkinsfile

echo "Fixes applied. Please review the changes in the jenkinsfile before committing."
