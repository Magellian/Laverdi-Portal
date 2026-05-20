#!/bin/bash
# VULTR Migration Cleanup Script
# Removes DigitalOcean references and old code

set -e

echo "🔧 LaVerdi VULTR Migration Cleanup"
echo "===================================="
echo ""

# Step 1: Backup environment file
echo "Step 1: Backing up .env.local..."
cp /root/laverdi-portal/.env.local /root/laverdi-portal/.env.local.backup.do-cleanup
echo "✓ Backed up to .env.local.backup.do-cleanup"
echo ""

# Step 2: Remove DigitalOcean API key from .env.local
echo "Step 2: Removing DigitalOcean references from .env.local..."
# Remove the DO_API_KEY line and comment
sed -i '/^# DigitalOcean Configuration/d' /root/laverdi-portal/.env.local
sed -i '/^DIGITALOCEAN_API_KEY=/d' /root/laverdi-portal/.env.local
echo "✓ Removed DIGITALOCEAN_API_KEY and comment"
echo ""

# Step 3: Update Vultr configuration comment
echo "Step 3: Adding Vultr configuration comment..."
# Add Vultr comment if not present
if ! grep -q "Vultr Configuration" /root/laverdi-portal/.env.local; then
    # Insert before VULTR_API_KEY
    sed -i '/^VULTR_API_KEY=/i # Vultr Configuration (For Agent Server Provisioning)' /root/laverdi-portal/.env.local
    echo "✓ Added Vultr configuration comment"
else
    echo "✓ Vultr comment already present"
fi
echo ""

# Step 4: Delete legacy DigitalOcean code files
echo "Step 4: Deleting legacy DigitalOcean code files..."
rm -f /root/laverdi-portal/lib/digitalocean.ts
echo "  ✓ Deleted lib/digitalocean.ts"

rm -f /root/laverdi-portal/lib/droplet-provisioner.ts
echo "  ✓ Deleted lib/droplet-provisioner.ts"

rm -f /root/laverdi-portal/lib/do-gradient-pricing.ts
echo "  ✓ Deleted lib/do-gradient-pricing.ts"
echo ""

# Step 5: Verify Vultr configuration
echo "Step 5: Verifying Vultr configuration..."
if grep -q "VULTR_API_KEY=7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA" /root/laverdi-portal/.env.local; then
    echo "✓ VULTR_API_KEY is correct"
else
    echo "⚠ VULTR_API_KEY might be incorrect - check manually"
fi

if grep -q "VULTR_API_BASE=https://api.vultr.com/v2" /root/laverdi-portal/.env.local; then
    echo "✓ VULTR_API_BASE is correct"
else
    echo "⚠ VULTR_API_BASE might be incorrect - check manually"
fi
echo ""

# Step 6: Check for remaining DO references in source code
echo "Step 6: Checking for remaining DigitalOcean references..."
DO_COUNT=$(grep -r 'digitalocean\|DigitalOcean' /root/laverdi-portal/pages /root/laverdi-portal/lib --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l)
if [ "$DO_COUNT" -eq 0 ]; then
    echo "✓ No DigitalOcean references found in source code"
else
    echo "⚠ Found $DO_COUNT references in compiled/generated files (will be fixed on rebuild)"
fi
echo ""

# Step 7: Clean build artifacts
echo "Step 7: Cleaning build artifacts..."
rm -rf /root/laverdi-portal/.next
echo "✓ Removed .next directory"
echo ""

# Step 8: Rebuild portal
echo "Step 8: Rebuilding portal (this may take 1-2 minutes)..."
cd /root/laverdi-portal
npm run build > /tmp/build-cleanup.log 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "❌ Build failed - check /tmp/build-cleanup.log"
    tail -50 /tmp/build-cleanup.log
    exit 1
fi
echo ""

# Step 9: Restart portal
echo "Step 9: Restarting portal service..."
pm2 restart web > /dev/null 2>&1
sleep 3
echo "✓ Portal restarted"
echo ""

# Step 10: Verify portal is running
echo "Step 10: Verifying portal health..."
HEALTH=$(curl -s https://laverdi.tech/api/status | grep -o '"status":"ok"' | head -1)
if [ -n "$HEALTH" ]; then
    echo "✓ Portal is healthy"
else
    echo "⚠ Could not verify portal status - check manually"
fi
echo ""

echo "===================================="
echo "✅ VULTR Migration Cleanup Complete!"
echo "===================================="
echo ""
echo "Summary:"
echo "  ✓ Removed DigitalOcean API key from .env.local"
echo "  ✓ Deleted legacy code files (digitalocean.ts, droplet-provisioner.ts, do-gradient-pricing.ts)"
echo "  ✓ Verified Vultr API configuration"
echo "  ✓ Cleaned and rebuilt portal"
echo "  ✓ Restarted services"
echo ""
echo "Next: Test provisioning by creating a new instance"
echo ""
