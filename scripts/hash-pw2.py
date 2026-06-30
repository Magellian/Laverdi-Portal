import sys, os
sys.path.insert(0, '/usr/local/lib/hermes-agent')
os.chdir('/usr/local/lib/hermes-agent')
from plugins.dashboard_auth.basic import hash_password
print(hash_password('laverdi-agent-2026'))
