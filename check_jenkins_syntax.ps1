# PowerShell script to check for other potential Jenkins pipeline issues

# Get the Jenkinsfile content
$content = Get-Content -Path "c:\Users\LOQ\Desktop\Nouveau dossier (3)\TuniHire\jenkinsfile" -Raw

# Common patterns to check
$issuePatterns = @(
    # Check for unbalanced braces
    @{
        Pattern = "{"
        Description = "Opening braces"
    },
    @{
        Pattern = "}"
        Description = "Closing braces"
    },
    # Check for other failFast instances
    @{
        Pattern = "failFast"
        Description = "failFast directive occurrences"
    },
    # Check for missing closing quotes
    @{
        Pattern = "'"
        Description = "Single quotes"
    },
    @{
        Pattern = "`""
        Description = "Double quotes"
    }
)

Write-Host "Jenkins Pipeline Syntax Check"
Write-Host "============================"
Write-Host ""

# Check balanced braces
$openingBraces = [regex]::Matches($content, "{").Count
$closingBraces = [regex]::Matches($content, "}").Count

if ($openingBraces -ne $closingBraces) {
    Write-Host "WARNING: Unbalanced braces detected!" -ForegroundColor Yellow
    Write-Host "  Opening braces: $openingBraces" -ForegroundColor Yellow
    Write-Host "  Closing braces: $closingBraces" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "PASSED: Braces are balanced." -ForegroundColor Green
    Write-Host "  Total braces: $openingBraces pairs" -ForegroundColor Green
    Write-Host ""
}

# Check patterns
foreach ($issue in $issuePatterns) {
    $count = [regex]::Matches($content, $issue.Pattern).Count
    Write-Host "$($issue.Description): $count occurrences"
}

# Check for failFast with other issues
$incorrectFailFast = [regex]::Matches($content, "parallel\s+\{\s+failFast").Count
if ($incorrectFailFast -gt 0) {
    Write-Host "ERROR: Found $incorrectFailFast occurrence(s) of incorrect failFast directive placement!" -ForegroundColor Red
} else {
    Write-Host "PASSED: No incorrect failFast directive placement found." -ForegroundColor Green
}

# Recommend next steps
Write-Host ""
Write-Host "Recommended next step: Run the Jenkins pipeline to verify if it builds successfully."
