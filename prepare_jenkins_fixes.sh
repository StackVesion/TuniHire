#!/bin/bash

# Script to prepare for Jenkins pipeline fixes
# Run this script before making changes to jenkinsfile

echo "Preparing for Jenkins pipeline fixes..."

# Create a backup of the current jenkinsfile
cp jenkinsfile jenkinsfile.backup.$(date +%Y%m%d%H%M%S)

# Check if there are any uncommitted changes
if command -v git &> /dev/null && [ -d .git ]; then
  git status
  echo ""
  echo "Note: Consider committing your changes before proceeding with pipeline fixes."
  echo ""
fi

# Check SonarQube scanner tool name
if grep -q "tool name: 'scanner'" jenkinsfile; then
  echo "SonarQube scanner tool is configured as 'scanner' in jenkinsfile."
  echo "This matches your Jenkins configuration."
else
  echo "WARNING: SonarQube scanner tool name not found or is not configured as 'scanner'."
  echo "Please verify your Jenkins configuration."
fi

# Check for problems with Admin-Panel css.d.ts file
if [ -f "Admin-Panel/src/types/css.d.ts" ]; then
  echo "Found Admin-Panel/src/types/css.d.ts file that may cause language detection conflicts."
  echo "The fix_sonarqube_scanner.sh script will add exclusion patterns for this file."
else
  echo "Admin-Panel/src/types/css.d.ts not found. You may need to adjust SonarQube exclusions accordingly."
fi

echo ""
echo "Preparation complete. Ready to apply fixes to jenkinsfile."
echo "Next steps:"
echo "1. Run the fix_sonarqube_scanner.sh script"
echo "2. Review changes to the jenkinsfile"
echo "3. Run the pipeline with SKIP_DOCKER_BUILD_PUSH=true and SKIP_DEPLOY=true"