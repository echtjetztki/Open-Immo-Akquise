set -euo pipefail

# Remove existing 5435 rules (if any), from highest index to lowest
RULES=$(ufw status numbered | grep '5435/tcp' | sed -E 's/^\[ *([0-9]+)\].*/\1/' | sort -rn || true)
for n in $RULES; do
  ufw --force delete "$n" >/dev/null 2>&1 || true
done

# Allow only these IPv4 addresses
ufw allow from 87.106.51.21 to any port 5435 proto tcp comment 'ses postgres self'
ufw allow from 85.215.215.96 to any port 5435 proto tcp comment 'ses postgres n8n server'
ufw allow from 85.13.132.120 to any port 5435 proto tcp comment 'ses postgres allowed ip'

# Deny all others on this port
ufw deny 5435/tcp comment 'block ses postgres for all others'

echo '=== UFW 5435 rules ==='
ufw status numbered | grep '5435/tcp' || true