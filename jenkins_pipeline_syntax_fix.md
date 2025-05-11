# Jenkins Pipeline Syntax Fix

I've fixed the syntax issues in your Jenkins pipeline file. The main problems were related to improper spacing and formatting between stage declarations.

## Fixes Applied

1. **Added proper spacing before stage declarations**:
   - Fixed spacing between `stages {` and `stage('Checkout')`
   - Added proper newlines between all stage declarations
   - Fixed spacing between the modules CI closing bracket and subsequent stages

2. **Fixed indentation in parallel block**:
   - Moved `failFast false` to be properly indented within the parallel block

## How to Validate the Fix

To validate that the syntax is correct before committing:

```powershell
# Install groovy if needed
choco install groovy -y

# Parse the jenkinsfile to check for syntax errors
groovy -e "def shell = new GroovyShell(); shell.parse(new File('c:\\Users\\LOQ\\Desktop\\Nouveau dossier (3)\\TuniHire\\jenkinsfile'))"
```

If no errors are reported, the syntax is correct.

## Next Steps

1. Commit the fixed jenkinsfile to your repository
2. Run the pipeline with the following parameters:
   - SKIP_SONAR = false (to test the SonarQube fixes)
   - SKIP_DOCKER_BUILD_PUSH = true
   - SKIP_DEPLOY = true

The pipeline should now run without syntax errors and with all the fixes we've implemented:
- Git shallow cloning
- SonarQube exclusions for Admin-Panel
- Quality Gate timeout reduction
- AI-Service module on master agent
