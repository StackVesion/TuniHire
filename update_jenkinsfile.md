# Update Jenkins Pipeline

To fix the pipeline issues directly in the jenkinsfile, run the following PowerShell script:

```powershell
$jenkinsfilePath = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"

# Create a backup of the current jenkinsfile
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$backupPath = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile.backup.$timestamp"
Copy-Item -Path $jenkinsfilePath -Destination $backupPath
Write-Host "Created backup at: $backupPath"

# Read the jenkinsfile content
$content = Get-Content -Path $jenkinsfilePath -Raw

# Apply changes

# 1. Replace SonarQube quality gate timeout
$content = $content -replace '(?<=timeout\(time: )5(?=, unit: ''MINUTES'')', '1'

# 2. Add specific SonarQube exclusions for Admin-Panel module
$content = $content -replace 'def sonarScannerPath = tool name: ''scanner''.*?sh "\$\{sonarScannerPath\}/bin/sonar-scanner -Dsonar.projectKey=\$\{SONAR_PROJECT_KEY\}"', 'def sonarScannerPath = tool name: ''scanner'', type: ''hudson.plugins.sonar.SonarRunnerInstallation''
                                                if (env.MODULE_NAME == "tunihire-admin-panel") {
                                                    sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**"
                                                } else {
                                                    sh "${sonarScannerPath}/bin/sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}"
                                                }'

# Write changes back to the file
$content | Set-Content -Path $jenkinsfilePath

Write-Host "Jenkins pipeline updated successfully!"
```

This script:
1. Creates a backup of your jenkinsfile
2. Reduces the SonarQube quality gate timeout from 5 to 1 minute
3. Adds specific exclusions for the Admin-Panel module to fix the language detection conflict for css.d.ts

Run the script, then verify the changes in your jenkinsfile before committing.
