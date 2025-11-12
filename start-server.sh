#!/bin/bash
# Kill any existing server on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null
# Start fresh server
cd "$(dirname "$0")"
echo "Starting server at http://localhost:8000"
python3 -m http.server 8000

