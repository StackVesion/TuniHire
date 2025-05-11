# PowerShell script to fix Jenkins pipeline indentation issues
# This script creates a fixed version of the Jenkins pipeline file

$original = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"
$backup = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile.backup.$(Get-Date -Format "yyyyMMddHHmmss")"
$fixed = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile_fixed_indentation.groovy"

# Make a backup
Copy-Item -Path $original -Destination $backup

# Fix the first issue (failFast directive)
$content = Get-Content -Path $original -Raw
$content = $content -replace "        stage\('Modules CI'\) \{\s+parallel \{\s+failFast false", "        stage('Modules CI') {`n            parallel(failFast: false) {"

# Fix the indentation issues around 'stage('Run Tests')
$content = $content -replace "(\s+}\s+}\s+}\s+)\s+stage\('Run Tests'\) \{", "`$1        stage('Run Tests') {"

# Fix all other indent issues where the pattern is "}        stage"
$content = $content -replace "(\s+}\s+)(\s+)stage", "`$1        stage"

# Write the fixed content to the new file
Set-Content -Path $fixed -Value $content

Write-Host "Fixed Jenkins pipeline has been written to: $fixed"
Write-Host "Original file backed up to: $backup"
