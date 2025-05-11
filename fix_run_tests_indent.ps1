# PowerShell script to fix Jenkins pipeline indentation for 'Run Tests' stage
# This addresses the specific indentation issue with the 'Run Tests' stage

$jenkinsfile = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile"
$backup = "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile.backup.$(Get-Date -Format "yyyyMMddHHmmss")"

# Make a backup
Copy-Item -Path $jenkinsfile -Destination $backup

# Read the file content
$content = Get-Content -Path $jenkinsfile -Raw

# Look for the pattern with incorrect indentation
$pattern = @'
                            }
        }
        
        stage\('Run Tests'\) \{
'@

# Define the correct indentation
$replacement = @'
                            }
                        }
                        
                        stage('Run Tests') {
'@

# Replace the content
$newContent = $content -replace $pattern, $replacement

# Write back to the original file
Set-Content -Path $jenkinsfile -Value $newContent

Write-Host "Jenkinsfile updated with fixed indentation for 'Run Tests' stage"
Write-Host "Backup created at: $backup"
