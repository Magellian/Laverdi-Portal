#!/bin/bash

# Quick Start Script for Laverdi Portal Test Agent & Command Center
# Usage: ./quick-start.sh [action]
# Actions: build, deploy, stop, clean, test

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="64.23.142.154"
NETWORK_NAME="laverdi-net"
IMAGE_PREFIX="laverdi"

echo -e "${YELLOW}🚀 Laverdi Portal Agent & Command Center Deployment${NC}\n"

# Functions
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    docker build -t ${IMAGE_PREFIX}/test-agent:latest ./test-agent
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ test-agent image built${NC}"
    else
        echo -e "${RED}✗ Failed to build test-agent image${NC}"
        exit 1
    fi
    
    docker build -t ${IMAGE_PREFIX}/command-center:latest ./command-center
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ command-center image built${NC}"
    else
        echo -e "${RED}✗ Failed to build command-center image${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All images built successfully!${NC}\n"
}

deploy_containers() {
    echo -e "${YELLOW}Deploying containers...${NC}"
    
    # Check if network exists
    if ! docker network inspect ${NETWORK_NAME} > /dev/null 2>&1; then
        echo -e "${YELLOW}Creating Docker network: ${NETWORK_NAME}${NC}"
        docker network create ${NETWORK_NAME}
    fi
    
    # Deploy command center
    echo -e "${YELLOW}Deploying command center...${NC}"
    docker run -d \
        --name command-center \
        --network ${NETWORK_NAME} \
        --restart unless-stopped \
        -e COMMAND_CENTER_URL=http://localhost:5000 \
        -e COMMAND_CENTER_PORT=5000 \
        -p 5000:5000 \
        ${IMAGE_PREFIX}/command-center:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ command-center deployed${NC}"
    else
        echo -e "${RED}✗ Failed to deploy command-center${NC}"
        exit 1
    fi
    
    # Deploy test agent 1
    echo -e "${YELLOW}Deploying test-agent-1...${NC}"
    docker run -d \
        --name test-agent-1 \
        --network ${NETWORK_NAME} \
        --restart unless-stopped \
        -e AGENT_ID=test-agent-1 \
        -e COMMAND_CENTER_URL=http://command-center:5000 \
        -e AGENT_HOST=test-agent-1 \
        -e AGENT_PORT=5001 \
        -p 5001:5001 \
        ${IMAGE_PREFIX}/test-agent:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ test-agent-1 deployed${NC}"
    else
        echo -e "${RED}✗ Failed to deploy test-agent-1${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All containers deployed successfully!${NC}\n"
    echo -e "${YELLOW}Access dashboard at: http://localhost:5000${NC}\n"
}

stop_containers() {
    echo -e "${YELLOW}Stopping containers...${NC}"
    
    docker stop command-center test-agent-1 test-agent-2 test-agent-3 2>/dev/null || true
    
    echo -e "${GREEN}Containers stopped${NC}\n"
}

clean_all() {
    echo -e "${RED}Cleaning up all containers and images...${NC}"
    
    stop_containers
    
    echo -e "${YELLOW}Removing containers...${NC}"
    docker rm command-center test-agent-1 test-agent-2 test-agent-3 2>/dev/null || true
    
    echo -e "${YELLOW}Removing images...${NC}"
    docker rmi ${IMAGE_PREFIX}/test-agent:latest ${IMAGE_PREFIX}/command-center:latest 2>/dev/null || true
    
    echo -e "${GREEN}Cleanup complete${NC}\n"
}

test_deployment() {
    echo -e "${YELLOW}Testing deployment...${NC}\n"
    
    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    sleep 3
    
    # Test command center health
    echo -e "${YELLOW}Testing command center health...${NC}"
    if curl -s http://localhost:5000/api/health | grep -q '"status"'; then
        echo -e "${GREEN}✓ Command center is healthy${NC}"
    else
        echo -e "${RED}✗ Command center health check failed${NC}"
    fi
    
    # Test agent health
    echo -e "${YELLOW}Testing agent health...${NC}"
    if curl -s http://localhost:5001/health | grep -q '"status"'; then
        echo -e "${GREEN}✓ Agent is healthy${NC}"
    else
        echo -e "${RED}✗ Agent health check failed${NC}"
    fi
    
    # Send echo task
    echo -e "${YELLOW}Sending echo task...${NC}"
    TASK_RESPONSE=$(curl -s -X POST http://localhost:5001/task \
        -H "Content-Type: application/json" \
        -d '{"task_id":"test-001","type":"echo","params":{"message":"Hello Test!"}}')
    
    if echo "$TASK_RESPONSE" | grep -q '"status"'; then
        echo -e "${GREEN}✓ Task accepted${NC}"
        echo "Response: $TASK_RESPONSE"
    else
        echo -e "${RED}✗ Task submission failed${NC}"
    fi
    
    # Check task status
    echo -e "${YELLOW}Checking task status...${NC}"
    sleep 2
    
    TASK_STATUS=$(curl -s http://localhost:5001/tasks/test-001)
    echo -e "${GREEN}Task Status:${NC}"
    echo "$TASK_STATUS" | jq . 2>/dev/null || echo "$TASK_STATUS"
    
    echo -e "\n${GREEN}✓ Deployment test complete!${NC}\n"
}

show_status() {
    echo -e "${YELLOW}Container Status:${NC}\n"
    docker ps -a --filter "name=command-center\|test-agent" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
}

show_usage() {
    echo "Usage: $0 [action]"
    echo ""
    echo "Actions:"
    echo "  build    - Build Docker images"
    echo "  deploy   - Deploy containers"
    echo "  stop     - Stop all containers"
    echo "  clean    - Remove all containers and images"
    echo "  test     - Test the deployment"
    echo "  status   - Show container status"
    echo "  full     - Build and deploy (default)"
    echo ""
}

# Main
ACTION=${1:-full}

case $ACTION in
    build)
        build_images
        ;;
    deploy)
        deploy_containers
        ;;
    stop)
        stop_containers
        ;;
    clean)
        clean_all
        ;;
    test)
        test_deployment
        ;;
    status)
        show_status
        ;;
    full)
        build_images
        deploy_containers
        show_status
        ;;
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}\n"
        show_usage
        exit 1
        ;;
esac

echo -e "${GREEN}Done!${NC}"
