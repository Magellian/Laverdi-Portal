#!/bin/bash
ssh -o StrictHostKeyChecking=no root@66.42.70.66 << 'EOF'
echo "[1] Admin UI"
cat /root/laverdi-portal/pages/admin/index.tsx

echo ""
echo "[2] Delete API"
cat /root/laverdi-portal/pages/api/admin/delete-user.ts

echo ""
echo "[3] Users API"
cat /root/laverdi-portal/pages/api/admin/users.ts
EOF
