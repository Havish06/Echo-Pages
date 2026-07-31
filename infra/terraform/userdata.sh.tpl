#!/usr/bin/env bash
# userdata.sh.tpl — runs on every EC2 instance launched by the ASG.
# Installs Nginx, pulls the latest built dist/ from the S3 artifacts bucket,
# and starts serving on port 80 so the ALB health check passes.
#
# Template variables (replaced by Terraform templatefile()):
#   artifacts_bucket   — name of the S3 artifacts bucket
#   artifacts_key      — S3 key prefix (e.g. "dist/")
#   nginx_conf         — contents of nginx/nginx.conf (base64)
#   default_conf       — contents of nginx/default.conf (base64)

set -euo pipefail

exec > >(tee -a /var/log/user-data.log) 2>&1
echo "=== echo-pages user-data start $(date -Is) ==="

ARTIFACTS_BUCKET="${artifacts_bucket}"
ARTIFACTS_KEY="${artifacts_key}"

# ── 1. Install packages ──────────────────────────────────────────
dnf clean all
dnf -y upgrade-minimal
dnf -y install nginx awscli util-linux

# ── 2. Apply Nginx configs (decoded from base64) ─────────────────
printf '%s' "${nginx_conf}" | base64 -d > /etc/nginx/nginx.conf
printf '%s' "${default_conf}" | base64 -d > /etc/nginx/conf.d/default.conf

# Web root
mkdir -p /usr/share/nginx/html
chown -R nginx:nginx /usr/share/nginx/html

# ── 3. Pull the built bundle from S3 ─────────────────────────────
echo "Pulling dist/ from s3://$ARTIFACTS_BUCKET/$ARTIFACTS_KEY"
aws s3 sync \
  "s3://$ARTIFACTS_BUCKET/$ARTIFACTS_KEY" \
  /usr/share/nginx/html/ \
  --no-progress \
  --delete || {
    # First boot may run before CI has uploaded anything — serve a
    # placeholder so the ALB health check still passes and the instance
    # is marked healthy. The next deployment / instance refresh will
    # overwrite this with the real bundle.
    echo "WARN: no artifacts yet, writing placeholder index"
    cat > /usr/share/nginx/html/index.html <<'HTML'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Echo Pages</title></head>
<body style="font-family:sans-serif;text-align:center;padding:5rem">
  <h1>Echo Pages</h1>
  <p>Build artifact not yet present. Waiting for first deploy.</p>
</body></html>
HTML
  }
chown -R nginx:nginx /usr/share/nginx/html

# ── 4. Enable + start Nginx ──────────────────────────────────────
systemctl enable nginx
systemctl restart nginx

# ── 5. Self-test before signalling ───────────────────────────────
sleep 2
if curl -fsS http://127.0.0.1:80/health >/dev/null; then
  echo "Self-test OK"
else
  echo "Self-test FAILED — Nginx not serving /health"
  systemctl status nginx --no-pager || true
  nginx -t || true
  # Do not exit nonzero; ASG will replace if health check keeps failing.
fi

echo "=== echo-pages user-data done $(date -Is) ==="
