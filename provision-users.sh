#!/bin/bash
# Provision two users via LaVerdi portal API

echo "Provisioning chrislaverdiere@gmail.com..."
curl -X POST http://localhost:3005/api/provision \
  -H "Content-Type: application/json" \
  -d '{"userId":"4593b36f-90c6-44a2-93d1-ba8e8be52a1c"}'

echo -e "\n---\n"

echo "Provisioning olivelaverdiere@gmail.com..."
curl -X POST http://localhost:3005/api/provision \
  -H "Content-Type: application/json" \
  -d '{"userId":"373a8fb0-a4b2-42d7-ba9d-7ae958601041"}'

echo -e "\n---\nDone."
