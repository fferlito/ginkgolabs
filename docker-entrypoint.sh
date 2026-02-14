#!/bin/sh
set -e
PORT="${PORT:-8080}"
cat <<EOF > /etc/nginx/conf.d/default.conf
server {
  listen ${PORT};
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files \$uri \$uri/ /index.html; }
  location /health { access_log off; return 200 "ok"; add_header Content-Type text/plain; }
}
EOF
exec "$@"
