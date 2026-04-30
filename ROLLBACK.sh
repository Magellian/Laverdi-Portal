#!/bin/bash

# ============================================================================
# LAVERDI PORTAL EMERGENCY ROLLBACK SCRIPT
# Use if deployment fails or critical issues arise
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║          LAVERDI PORTAL EMERGENCY ROLLBACK INITIATED              ║"
echo "║          This will revert to the previous stable version          ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Safety check
read -p "Are you sure you want to rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

echo "Starting rollback process..."
echo ""

# Step 1: Stop current containers
echo "[1/5] Stopping current deployment..."
docker-compose down
if [ $? -ne 0 ]; then
    echo "❌ Failed to stop containers"
    exit 1
fi
echo "✓ Containers stopped"
echo ""

# Step 2: Revert to previous version
echo "[2/5] Reverting to previous commit..."
git checkout HEAD~1
if [ $? -ne 0 ]; then
    echo "❌ Failed to checkout previous version"
    exit 1
fi
echo "✓ Code reverted"
echo ""

# Step 3: Rebuild Docker image
echo "[3/5] Rebuilding Docker image (this may take 2-3 minutes)..."
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    echo "❌ Failed to rebuild Docker image"
    exit 1
fi
echo "✓ Docker image rebuilt"
echo ""

# Step 4: Start services
echo "[4/5] Starting services..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "❌ Failed to start services"
    exit 1
fi
echo "✓ Services started"
echo ""

# Step 5: Verify health
echo "[5/5] Verifying deployment..."
sleep 5  # Wait for services to stabilize
docker-compose ps
echo ""

# Check if web service is running
if docker-compose logs | grep -q "ready - started server"; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                   ✓ ROLLBACK SUCCESSFUL                           ║"
    echo "║              Previous version is now running                       ║"
    echo "║         Check logs for any issues: docker-compose logs             ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                   ⚠ ROLLBACK COMPLETED BUT...                     ║"
    echo "║          Services may not be fully healthy yet                     ║"
    echo "║         Monitor logs: docker-compose logs -f laverdi-portal        ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    exit 1
fi
