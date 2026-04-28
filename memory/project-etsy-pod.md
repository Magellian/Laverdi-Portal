# Etsy POD Machine - Project State

## Project Overview
Building a fully automated Etsy print-on-demand pipeline using n8n, Docker, and AI generation.

## Infrastructure
- **Host:** Windows (BIOS virtualization + Hyper-V + WSL2 enabled)
- **Runtime:** Docker Desktop
- **Automation:** local n8n instance in Docker

## Workflow Architecture
- **Workflow A (Asset Generator):** Raw art → AI generation → Background removal → QC → Upload to Google Drive.
- **Workflow B (Printify Draft Builder):** Approved art → Printify upload → Tee/Crew product drafts → Google Sheets tracking.
- **Workflow C (Planned):** Etsy listing and publish layer.

## Known Issues & Technical Debt
- **Hardcoded Secrets:** API keys for Printify, OpenAI, and remove.bg are currently hardcoded in n8n nodes.
- **Data Model:** Filename parser and overall data structure need hardening.
- **Metadata:** A bug where File ID was storing filenames was fixed, but needs verification in long runs.

## Next Steps
1. Export Workflow B, move secrets to environment variables/n8n credentials, and re-import.
2. Harden filename parser and data model.
3. Build Workflow C (Etsy listing/publish layer).
4. Implement a review queue and run logging.
5. Future: Automate trend research intake.
