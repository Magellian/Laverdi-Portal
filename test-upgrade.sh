#!/bin/bash
curl -s -X POST http://localhost:3000/api/admin/upgrade-user \
  -H "Authorization: Bearer admin-token-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"email":"crawfordtest-1777235823@laverdi-test.com","tier":"starter"}'
