@echo off
set NODE_OPTIONS=--openssl-legacy-provider
set SKIP_PREFLIGHT_CHECK=true
echo Starting development server with legacy OpenSSL provider...
cd Admin-Panel
npm start 