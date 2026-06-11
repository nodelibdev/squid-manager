mkfifo /tmp/squid-reload-pipe

sudo tee /etc/systemd/system/squid-reload-listener.service << 'EOF'
[Unit]
Description=Squid reload listener

[Service]
ExecStart=/bin/sh -c 'while true; do read line < /tmp/squid-reload-pipe && systemctl reload squid; done'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now squid-reload-listener
