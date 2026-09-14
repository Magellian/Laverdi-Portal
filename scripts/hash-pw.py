import sys
sys.path.insert(0, '/usr/local/lib/hermes-agent')
from hermes_cli.plugins.dashboard_auth.basic import hash_password
print(hash_password('laverdi-agent-2026'))
