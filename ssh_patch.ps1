#!/usr/bin/env pwsh

$ip = "66.42.70.66"
$user = "root"
$password = "F,6f`$)bZKYr9CTDN"
$file = "/root/laverdi-portal/pages/api/provision.ts"

# Create SSH key file approach - read file first
$cmd = @"
`$env:SSHPASS = '$password'
sshpass -p '$password' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$ip "cat $file"
"@

Write-Host "Attempting to fetch file via SSH..."
iex $cmd
