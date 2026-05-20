#!/bin/bash
VULTR_KEY="7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA"
INSTANCE_ID="10ce1898-7ef9-4723-831a-bb218397ec3e"

curl -s "https://api.vultr.com/v2/instances/$INSTANCE_ID" \
  -H "Authorization: Bearer $VULTR_KEY" \
  | jq '.instance | {status: .status, power_status: .power_status, server_status: .server_status}'
