#!/bin/sh
set -e

# Inject VITE_API_BASE_URL vào window.__ENV__ ở runtime
cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8080}"
};
EOF

exec "$@"
