$jenkinsfilePath = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"
$content = Get-Content -Path $jenkinsfilePath -Raw

# Find and update the Admin-Panel SonarQube Analysis section
$adminPanelSection = $content | Select-String -Pattern "MODULE_DIR = "Admin-Panel".*?SonarQube Analysis.*?${sonarScannerPath}/bin/sonar-scanner -Dsonar\.projectKey=\" -AllMatches

if ($adminPanelSection) {
    Write-Host "Found Admin-Panel section. Updating..."
    # Replace the sonar-scanner command with one that includes exclusions
    $content = $content -replace "(${sonarScannerPath}/bin/sonar-scanner -Dsonar\.projectKey=\)"", "$1 -Dsonar.exclusions=src/types/css.d.ts,node_modules/**,.next/**""
    
    # Write the updated content back to the file
    Set-Content -Path $jenkinsfilePath -Value $content
    Write-Host "Admin-Panel SonarQube scanner command updated successfully."
} else {
    Write-Host "Admin-Panel section not found or already updated."
}
