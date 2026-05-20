"""
Telegram Channel Configuration Handler
Validates Telegram bot tokens and sets up webhooks

This replaces/updates the existing /api/configure-channels endpoint
to properly handle Telegram bot setup.
"""

import os
import requests
import json
from datetime import datetime
from typing import Dict, Any, Tuple

# Assuming Flask + Supabase are already imported in the main app
# This is just the handler function


def configure_telegram_channel(user_id: str, token: str, supabase_client) -> Tuple[bool, Dict[str, Any]]:
    """
    Configure a Telegram bot for a user.
    
    1. Validates the bot token with Telegram API
    2. Sets up a webhook so Telegram knows where to send messages
    3. Stores configuration in database
    
    Args:
        user_id: UUID of the user
        token: Telegram bot token (from @BotFather)
        supabase_client: Authenticated Supabase client
    
    Returns:
        (success: bool, data: dict with bot info or error message)
    """
    
    TELEGRAM_API_BASE = "https://api.telegram.org"
    WEBHOOK_URL = os.getenv("LAVERDI_WEBHOOK_URL", "https://laverdi.tech")
    
    # ──────────────────────────────────────────────────────────────────────────
    # STEP 1: Validate token with Telegram API
    # ──────────────────────────────────────────────────────────────────────────
    
    try:
        print(f"[Telegram] Validating token for user {user_id}...")
        
        validate_url = f"{TELEGRAM_API_BASE}/bot{token}/getMe"
        response = requests.get(validate_url, timeout=10)
        
        if response.status_code != 200:
            error_msg = f"Telegram API error: {response.status_code}"
            print(f"[Telegram] ❌ {error_msg}")
            return False, {"error": error_msg}
        
        bot_data = response.json()
        
        if not bot_data.get("ok"):
            error_msg = bot_data.get("description", "Unknown Telegram error")
            print(f"[Telegram] ❌ Invalid token: {error_msg}")
            return False, {"error": f"Invalid bot token: {error_msg}"}
        
        bot_info = bot_data["result"]
        bot_id = bot_info.get("id")
        bot_username = bot_info.get("username", "unknown")
        
        print(f"[Telegram] ✅ Token validated. Bot: @{bot_username} (ID: {bot_id})")
        
    except requests.exceptions.Timeout:
        error_msg = "Telegram API timeout - bot token validation failed"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error validating token: {str(e)}"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    except Exception as e:
        error_msg = f"Unexpected error validating token: {str(e)}"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    
    # ──────────────────────────────────────────────────────────────────────────
    # STEP 2: Set up webhook
    # ──────────────────────────────────────────────────────────────────────────
    
    webhook_url = f"{WEBHOOK_URL}/api/webhooks/telegram?user_id={user_id}"
    
    try:
        print(f"[Telegram] Setting webhook to {webhook_url}...")
        
        webhook_request = {
            "url": webhook_url,
            "allowed_updates": ["message", "callback_query", "edited_message"]
        }
        
        set_webhook_url = f"{TELEGRAM_API_BASE}/bot{token}/setWebhook"
        response = requests.post(set_webhook_url, json=webhook_request, timeout=10)
        
        if response.status_code != 200:
            error_msg = f"Failed to set webhook: {response.status_code}"
            print(f"[Telegram] ❌ {error_msg}")
            return False, {"error": error_msg}
        
        webhook_data = response.json()
        
        if not webhook_data.get("ok"):
            error_msg = webhook_data.get("description", "Unknown webhook error")
            print(f"[Telegram] ❌ Webhook setup failed: {error_msg}")
            return False, {"error": f"Webhook setup failed: {error_msg}"}
        
        print(f"[Telegram] ✅ Webhook set successfully")
        
    except requests.exceptions.Timeout:
        error_msg = "Telegram API timeout - webhook setup failed"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error setting webhook: {str(e)}"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    except Exception as e:
        error_msg = f"Unexpected error setting webhook: {str(e)}"
        print(f"[Telegram] ❌ {error_msg}")
        return False, {"error": error_msg}
    
    # ──────────────────────────────────────────────────────────────────────────
    # STEP 3: Store in database
    # ──────────────────────────────────────────────────────────────────────────
    
    try:
        print(f"[Telegram] Storing in database...")
        
        # Check if channel already exists for this user
        existing = supabase_client.table("channels").select("*").eq(
            "user_id", user_id
        ).eq("platform", "telegram").execute()
        
        config = {
            "bot_id": bot_id,
            "bot_username": bot_username,
            "webhook_url": webhook_url,
            "configured_at": datetime.utcnow().isoformat()
        }
        
        if existing.data:
            # Update existing record
            response = supabase_client.table("channels").update({
                "token": token,
                "verified": True,
                "verified_at": datetime.utcnow().isoformat(),
                "config": config,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).eq("platform", "telegram").execute()
            print(f"[Telegram] ✅ Updated existing channel record")
        else:
            # Insert new record
            response = supabase_client.table("channels").insert({
                "user_id": user_id,
                "platform": "telegram",
                "token": token,
                "verified": True,
                "verified_at": datetime.utcnow().isoformat(),
                "webhook_url": webhook_url,
                "config": config,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
            print(f"[Telegram] ✅ Created new channel record")
        
        return True, {
            "success": True,
            "bot_id": bot_id,
            "bot_username": bot_username,
            "webhook_url": webhook_url,
            "message": f"Telegram bot @{bot_username} connected successfully!"
        }
        
    except Exception as e:
        error_msg = f"Database error: {str(e)}"
        print(f"[Telegram] ❌ {error_msg}")
        # Token is validated and webhook is set up, so this is not critical
        # But return error so user knows to retry
        return False, {"error": error_msg}


# ──────────────────────────────────────────────────────────────────────────
# Flask Route Handler (add this to your app.py)
# ──────────────────────────────────────────────────────────────────────────

def create_configure_channels_handler(supabase_client):
    """
    Factory function to create the /api/configure-channels handler.
    
    Usage in app.py:
        @app.route('/api/configure-channels', methods=['POST'])
        def configure_channels():
            return _handle_configure_channels()
    """
    
    def _handle_configure_channels():
        from flask import request, jsonify
        
        try:
            data = request.json or {}
            user_id = data.get("user_id")
            platform = data.get("platform")
            token = data.get("token")
            
            # Validate inputs
            if not all([user_id, platform, token]):
                return jsonify({
                    "success": False,
                    "error": "Missing required fields: user_id, platform, token"
                }), 400
            
            print(f"[configure-channels] Received: platform={platform}, user={user_id}")
            
            # Route to appropriate handler
            if platform == "telegram":
                success, response_data = configure_telegram_channel(
                    user_id, token, supabase_client
                )
                return jsonify({
                    "success": success,
                    "data": response_data
                }), (200 if success else 400)
            
            else:
                # Placeholder for other platforms
                return jsonify({
                    "success": False,
                    "error": f"Platform '{platform}' not yet implemented"
                }), 501
        
        except Exception as e:
            print(f"[configure-channels] Error: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Server error: {str(e)}"
            }), 500
    
    return _handle_configure_channels
