"""Scrub known secrets from all text files in the workspace."""
import os
import re

WORKSPACE = r"C:\Users\chris\.openclaw\workspace"

# Map of secret patterns to replacements
SECRETS = {
    # SendGrid API Key
    "SG.REDACTED_SENDGRID_KEY": "SG.REDACTED_SENDGRID_KEY",
    # DigitalOcean Personal Access Token
    "dop_v1_REDACTED_DO_TOKEN": "dop_v1_REDACTED_DO_TOKEN",
    # DigitalOcean Inference Key
    "sk-do-REDACTED_DO_INFERENCE_KEY": "sk-do-REDACTED_DO_INFERENCE_KEY",
    # Stripe Test Secret Key
    "sk_test_REDACTED_STRIPE_SECRET": "sk_test_REDACTED_STRIPE_SECRET",
    # Stripe Test Publishable Key
    "pk_test_REDACTED_STRIPE_PUBLISHABLE": "pk_test_REDACTED_STRIPE_PUBLISHABLE",
    # Stripe Webhook Secret
    "whsec_REDACTED_STRIPE_WEBHOOK": "whsec_REDACTED_STRIPE_WEBHOOK",
    # Supabase Service Role Key
    "REDACTED_SUPABASE_SERVICE_ROLE_KEY": "REDACTED_SUPABASE_SERVICE_ROLE_KEY",
    # Supabase Anon Key (less sensitive but still)
    "REDACTED_SUPABASE_ANON_KEY": "REDACTED_SUPABASE_ANON_KEY",
    # Anthropic API Key
    "sk-ant-REDACTED_ANTHROPIC_KEY": "sk-ant-REDACTED_ANTHROPIC_KEY",
    # DigitalOcean alt token (from old docs)
    "dop_v1_REDACTED_DO_TOKEN_ALT": "dop_v1_REDACTED_DO_TOKEN_ALT",
}

SKIP_DIRS = {".git", "node_modules", ".next", "__pycache__"}
TEXT_EXTS = {".md", ".txt", ".ts", ".tsx", ".js", ".json", ".py", ".sh", ".sql", ".html", ".css", ".conf", ".yml", ".yaml", ".env", ".ps1", ".bat", ".vbs", ".local"}

count = 0
files_modified = 0

for root, dirs, files in os.walk(WORKSPACE):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fname in files:
        fpath = os.path.join(root, fname)
        ext = os.path.splitext(fname)[1].lower()
        # Also match extensionless files and dotfiles
        if ext not in TEXT_EXTS and fname not in (".gitignore", ".env", ".env.local", ".env.production"):
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except:
            continue

        original = content
        for secret, replacement in SECRETS.items():
            if secret in content:
                content = content.replace(secret, replacement)
                count += 1

        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            files_modified += 1
            rel = os.path.relpath(fpath, WORKSPACE)
            print(f"  Scrubbed: {rel}")

print(f"\nDone: {count} secrets replaced across {files_modified} files")
