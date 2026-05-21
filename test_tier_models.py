#!/usr/bin/env python3
"""Test the new tier-based model routing"""

import requests
import json

BASE_URL = "http://66.42.70.66/api/inference/chat"

# Test cases for each tier
test_cases = [
    {
        "tier": "trial",
        "userId": "test-user-trial",
        "message": "What is the capital of France?",
    },
    {
        "tier": "starter",
        "userId": "test-user-starter",
        "message": "Explain quantum computing briefly",
    },
    {
        "tier": "professional",
        "userId": "test-user-professional",
        "message": "Solve: If I have 10 apples and eat 3, how many are left?",
    },
    {
        "tier": "agency",
        "userId": "test-user-agency",
        "message": "Write a Python function to check if a number is prime",
    },
    {
        "tier": "enterprise",
        "userId": "test-user-enterprise",
        "message": "This should fail with coming soon message",
    },
]

print("=" * 70)
print("Testing Model Tier-Based Routing")
print("=" * 70)

for test in test_cases:
    print(f"\n📝 Testing {test['tier'].upper()} tier")
    print(f"   User: {test['userId']}")
    print(f"   Message: {test['message'][:50]}...")
    
    try:
        response = requests.post(
            BASE_URL,
            json=test,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Model: {data.get('model', 'Unknown')}")
            print(f"   ✅ Tokens: {data.get('tokensUsed', 0)}")
            print(f"   ✅ Response: {data.get('response', '')[:80]}...")
        elif response.status_code == 402:
            # Coming soon
            data = response.json()
            print(f"   ⏳ Status: {data.get('error', 'Coming soon')}")
        else:
            data = response.json()
            print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
    
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection error (endpoint may not be live yet)")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

print("\n" + "=" * 70)
print("Testing Complete")
print("=" * 70)
