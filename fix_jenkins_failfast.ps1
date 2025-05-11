# PowerShell script to fix Jenkins pipeline
# This approach focuses on just fixing the failFast directive issue

$original = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"
$backup = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile.backup.$(Get-Date -Format "yyyyMMddHHmmss")"
$fixed = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile_fixed.groovy"

# Make a backup
Copy-Item -Path $original -Destination $backup

# Read the file content
$content = Get-Content -Path $original -Raw

# Fix the failFast directive syntax
# Look specifically for this pattern
$pattern = "parallel {`r?`n\s+failFast false"
$replacement = "parallel(failFast: false) {"

# Replace the text
$newContent = $content -replace $pattern, $replacement

# Write to new file
Set-Content -Path $fixed -Value $newContent

Write-Host "Fixed Jenkins pipeline has been written to: $fixed"
Write-Host "Original file backed up to: $backup"
