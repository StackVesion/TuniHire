#!/usr/bin/env node

/**
 * Dummy test script for front-end projects
 * Creates a JUnit-compatible test results file for Jenkins
 */

console.log('Running dummy test for front-end project');
const fs = require('fs');
const path = require('path');

// Create a simple JUnit XML file for Jenkins
const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Frontend Tests" tests="1" errors="0" failures="0" skipped="0">
    <testcase classname="DummyTest" name="should pass this placeholder test" />
  </testsuite>
</testsuites>`;

const projectRoot = path.dirname(__dirname);
fs.writeFileSync(path.join(projectRoot, 'test-results.xml'), junitXml);
console.log(`Created dummy test results at ${path.join(projectRoot, 'test-results.xml')}`);

process.exit(0);
