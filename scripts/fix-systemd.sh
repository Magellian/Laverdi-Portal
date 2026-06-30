#!/bin/bash
cat > /etc/systemd/system/hermes-cmqx0egxq0005nx0i6sdzr9qf.service << 'EOF'
[Unit]
Description=Hermes Agent Instance cmqx0egxq
After=network.target

[Service]
Type=simple
User=root
Environment=HOME=/root
EnvironmentFile=/root/.hermes/profiles/user-cmqx0egxq/.env
ExecStart=/usr/local/bin/hermes --profile user-cmqx0egxq gateway run --replace
Restart=always
RestartSec=5
TimeoutStopSec=210

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl stop hermes-cmqx0egxq0005nx0i6sdzr9qf
sleep 2
systemctl start hermes-cmqx0egxq0005nx0i6sdzr9qf
sleep 8
journalctl -u hermes-cmqx0egxq0005nx0i6sdzr9qf --since '10 seconds ago' --no-pager
