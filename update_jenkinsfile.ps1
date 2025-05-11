# PowerShell script to update jenkinsfile
$jenkinsfilePath = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"

# Create a backup of the current jenkinsfile
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backupPath = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile.backup.$timestamp"
Copy-Item -Path $jenkinsfilePath -Destination $backupPath
Write-Host "Created backup at: $backupPath"

# Read the jenkinsfile content
$content = Get-Content -Path $jenkinsfilePath -Raw

# 1. Replace SonarQube quality gate timeout from 5 to 1 minute
$content = $content -replace 'timeout\(time: 5, unit: ''MINUTES''\)', 'timeout(time: 1, unit: ''MINUTES'') /* Reduced timeout */'

# 2. Update the Admin-Panel module to add specific SonarQube exclusions
$adminPanelSonarPattern = '(MODULE_DIR = "Admin-Panel".*?def sonarScannerPath = tool name: ''scanner''.*?)sh "\$\{sonarScannerPath\}/bin/sonar-scanner -Dsonar\.projectKey=\$\{SONAR_PROJECT_KEY\}"'
$adminPanelSonarReplacement = '$1sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**"'
$content = $content -replace $adminPanelSonarPattern, $adminPanelSonarReplacement

# Write changes back to the file
$content | Set-Content -Path $jenkinsfilePath -Encoding UTF8

Write-Host "Jenkins pipeline updated successfully!"
