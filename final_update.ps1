# Find all instances of Admin-Panel's SonarQube scanner command and update them
$content = Get-Content -Path "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile" -Raw

# Make sure Admin-Panel module includes the exclusion parameter for css.d.ts
$pattern = '(MODULE_NAME = "tunihire-admin-panel".*?withSonarQubeEnv\(''scanner''\).*?sonarScannerPath = tool name: ''scanner''.*?)sh "\$\{sonarScannerPath\}/bin/sonar-scanner -Dsonar.projectKey=\$\{SONAR_PROJECT_KEY\}"'
$replacement = '$1sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**"'

# Use the regex with dotall option to match across multiple lines
$content = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Write the updated content back to the file
Set-Content -Path "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile" -Value $content

Write-Host "Jenkins pipeline updated with all fixes."
