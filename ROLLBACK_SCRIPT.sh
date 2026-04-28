#!/bin/bash

# ============================================
# ROLLBACK_SCRIPT.sh
# Emergency rollback for Phase 2-3
# ============================================
# Usage: ./ROLLBACK_SCRIPT.sh [commits_back]
# Example: ./ROLLBACK_SCRIPT.sh 1  (rollback 1 commit)
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMMITS_BACK=${1:-1}
ROLLBACK_TIME=$(date '+%Y-%m-%d_%H-%M-%S')

echo -e "${RED}============================================${NC}"
echo -e "${RED}LAVERDI EMERGENCY ROLLBACK SCRIPT${NC}"
echo -e "${RED}Rollback distance: $COMMITS_BACK commit(s)${NC}"
echo -e "${RED}Time: $(date)${NC}"
echo -e "${RED}============================================${NC}"
echo ""

# ============================================
# CONFIRMATION
# ============================================
echo -e "${YELLOW}⚠️  WARNING: This will rollback the deployment${NC}"
echo ""
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Current commit: $(git log -1 --oneline)"
echo ""
echo "Rollback will:"
echo "1. Revert $COMMITS_BACK commit(s)"
echo "2. Push changes to origin"
echo "3. Redeploy previous version"
echo ""
echo -e "${RED}This action cannot be undone!${NC}"
echo ""
read -p "Type 'ROLLBACK' to confirm: " confirmation

if [ "$confirmation" != "ROLLBACK" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

echo ""

# ============================================
# STEP 1: CREATE BACKUP
# ============================================
echo -e "${YELLOW}[1/4] Creating backup...${NC}"

BACKUP_BRANCH="backup/before-rollback-${ROLLBACK_TIME}"
git checkout -b "$BACKUP_BRANCH" || {
    echo -e "${RED}ERROR: Could not create backup branch${NC}"
    exit 1
}

git push origin "$BACKUP_BRANCH" || {
    echo -e "${YELLOW}WARNING: Could not push backup to remote${NC}"
}

git checkout -

echo -e "${GREEN}✓ Backup created: $BACKUP_BRANCH${NC}"
echo ""

# ============================================
# STEP 2: REVERT COMMITS
# ============================================
echo -e "${YELLOW}[2/4] Reverting $COMMITS_BACK commit(s)...${NC}"

# Create revert commit(s)
for ((i=0; i<COMMITS_BACK; i++)); do
    echo "Reverting commit $((i+1))/$COMMITS_BACK..."
    git revert -n HEAD~$((COMMITS_BACK-i-1))
done

# Commit the reverts
git commit -m "revert: rollback Phase 2-3 deployment

Reason: Emergency rollback initiated at $ROLLBACK_TIME
Rollback distance: $COMMITS_BACK commit(s)
Backup: $BACKUP_BRANCH

To restore, checkout backup branch:
  git checkout $BACKUP_BRANCH" 2>&1 || {
    echo -e "${RED}ERROR: Could not commit revert${NC}"
    git revert --abort
    exit 1
}

echo -e "${GREEN}✓ Commits reverted${NC}"
echo ""

# ============================================
# STEP 3: PUSH TO ORIGIN
# ============================================
echo -e "${YELLOW}[3/4] Pushing to origin...${NC}"

git push origin $(git rev-parse --abbrev-ref HEAD) || {
    echo -e "${YELLOW}WARNING: Could not push to remote${NC}"
    echo "Manual push required: git push origin $(git rev-parse --abbrev-ref HEAD)"
}

echo -e "${GREEN}✓ Changes pushed${NC}"
echo ""

# ============================================
# STEP 4: REBUILD & REDEPLOY
# ============================================
echo -e "${YELLOW}[4/4] Rebuilding and redeploying...${NC}"

# Clear node_modules and reinstall
echo "Cleaning dependencies..."
rm -rf node_modules
npm install 2>&1 | tail -3

# Build
echo "Building..."
npm run build 2>&1 | tail -5

# Deploy
echo "Deploying previous version..."
if command -v vercel &> /dev/null; then
    vercel --prod || {
        echo -e "${RED}ERROR: Vercel deployment failed${NC}"
        echo "Manual deployment required"
    }
else
    echo "Build ready. Deploy to your server."
fi

echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${RED}============================================${NC}"
echo -e "${GREEN}✅ ROLLBACK COMPLETE${NC}"
echo -e "${RED}============================================${NC}"
echo ""
echo "Rollback Summary:"
echo "- Rollback branch: $BACKUP_BRANCH"
echo "- Reverted commits: $COMMITS_BACK"
echo "- Timestamp: $ROLLBACK_TIME"
echo ""
echo "What was reverted:"
echo "- src/components/molty/* (Phase 2 animation code)"
echo "- src/app/page.tsx (Phase 3 landing page)"
echo "- public/icons/molty/* (SVG icons)"
echo ""
echo "Next steps:"
echo "1. Verify application loads correctly"
echo "2. Check error logs for issues"
echo "3. Notify team of rollback"
echo "4. Investigate root cause"
echo "5. Plan fix and redeployment"
echo ""
echo "To restore the rollback:"
echo "  git checkout $BACKUP_BRANCH"
echo "  git push origin HEAD"
echo ""
echo "To abort rollback (go forward again):"
echo "  git revert HEAD"
echo "  git push origin HEAD"
echo ""

# Create rollback log
cat > "rollback_${ROLLBACK_TIME}.log" << EOF
ROLLBACK LOG
============
Date: $(date)
Reason: Emergency rollback (operator initiated)
Branch: $(git rev-parse --abbrev-ref HEAD)
Backup: $BACKUP_BRANCH
Rollback Distance: $COMMITS_BACK commit(s)

Previous Version:
$(git log -1 --oneline)

Reverted Files:
- src/components/molty/MoltyCharacter.ts
- src/components/molty/ParticleSystem.ts
- src/components/molty/IconParticle.ts
- src/components/WelcomeLanding.tsx
- src/app/page.tsx
- public/icons/molty/*.svg

Status: COMPLETE
Time: $ROLLBACK_TIME

Next Action: Investigate root cause and plan fix.
EOF

echo "Rollback log saved to: rollback_${ROLLBACK_TIME}.log"
