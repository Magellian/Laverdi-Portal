# Add these endpoints to /root/command-center.py
# Insert BEFORE the `if __name__ == '__main__':` block

# ─── Channel Configuration Endpoints ──────────────────────────────────

from functools import wraps
import requests
import json

# Helper: Check Bearer token
def require_auth(request):
    """Verify API token in Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    # Compare against environment variable or config
    expected_token = os.getenv('LAVERDI_ADMIN_API_TOKEN', 'laverdi-admin-api-2026')
    return token == expected_token


@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """
    Store channel credentials (Telegram, Discord, Slack, etc.)
    and set up webhooks.
    
    Request:
    {
      "userId": "uuid",
      "channels": {
        "telegram": {
          "botToken": "123456:ABC...",
          "enabled": true
        }
      }
    }
    
    Response:
    {
      "success": true,
      "channels": {...}
    }
    """
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = data.get('userId')
    channels = data.get('channels', {})
    
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        # Process each channel
        results = {}
        
        for channel_name, config in channels.items():
            if not config or not isinstance(config, dict):
                continue
            
            app.logger.info(f"Configuring {channel_name} for user {user_id}")
            
            # ─── Telegram Validation ──────────────────────────────
            if channel_name == 'telegram':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Missing botToken'
                    }
                    continue
                
                # Validate token format
                if not bot_token.count(':') == 1:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Invalid token format (should be ID:TOKEN)'
                    }
                    continue
                
                # Call Telegram API to verify
                try:
                    resp = requests.get(
                        f'https://api.telegram.org/bot{bot_token}/getMe',
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {
                            'success': False,
                            'error': f'Telegram API error: {resp.status_code}'
                        }
                        continue
                    
                    telegram_user = resp.json()
                    if not telegram_user.get('ok'):
                        results[channel_name] = {
                            'success': False,
                            'error': f"Telegram API error: {telegram_user.get('description', 'Unknown error')}"
                        }
                        continue
                    
                    bot_info = telegram_user.get('result', {})
                    app.logger.info(f"✓ Telegram bot validated: {bot_info.get('username')}")
                    
                    # Store in Supabase
                    insert_channel(
                        user_id=user_id,
                        channel_name='telegram',
                        config={
                            'botToken': bot_token,
                            'botId': bot_info.get('id'),
                            'botUsername': bot_info.get('username'),
                            'enabled': config.get('enabled', True)
                        }
                    )
                    
                    results[channel_name] = {
                        'success': True,
                        'botUsername': bot_info.get('username')
                    }
                
                except requests.exceptions.Timeout:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Telegram API timeout'
                    }
                except requests.exceptions.RequestException as e:
                    results[channel_name] = {
                        'success': False,
                        'error': f'Request error: {str(e)}'
                    }
            
            # ─── Discord Validation ──────────────────────────────
            elif channel_name == 'discord':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Missing botToken'
                    }
                    continue
                
                try:
                    resp = requests.get(
                        'https://discordapp.com/api/users/@me',
                        headers={'Authorization': f'Bot {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {
                            'success': False,
                            'error': f'Invalid Discord token'
                        }
                        continue
                    
                    discord_user = resp.json()
                    
                    insert_channel(
                        user_id=user_id,
                        channel_name='discord',
                        config={
                            'botToken': bot_token,
                            'botId': discord_user.get('id'),
                            'botUsername': discord_user.get('username'),
                            'enabled': config.get('enabled', True)
                        }
                    )
                    
                    results[channel_name] = {
                        'success': True,
                        'botUsername': discord_user.get('username')
                    }
                
                except requests.exceptions.RequestException as e:
                    results[channel_name] = {
                        'success': False,
                        'error': f'Request error: {str(e)}'
                    }
            
            # ─── Other Channels (placeholder) ──────────────────────
            else:
                # TODO: Implement Slack, WhatsApp, Signal validation
                insert_channel(
                    user_id=user_id,
                    channel_name=channel_name,
                    config=config
                )
                results[channel_name] = {
                    'success': True,
                    'note': f'{channel_name} stored (validation not implemented yet)'
                }
        
        return jsonify({
            'success': True,
            'channels': results
        }), 200
    
    except Exception as e:
        app.logger.error(f"Error in configure_channels: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """
    Fetch stored channel configuration for a user.
    
    Query: ?userId=uuid
    
    Response:
    {
      "channels": {
        "telegram": {
          "enabled": true,
          "connected": true,
          "botUsername": "mybot"
        }
      }
    }
    """
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        channels_data = query_channels(user_id)
        
        response = {
            'channels': {}
        }
        
        for channel in channels_data:
            channel_name = channel['channel_name']
            config = channel['config'] or {}
            
            response['channels'][channel_name] = {
                'enabled': channel['enabled'],
                'connected': channel['connected'],
                'botUsername': config.get('botUsername', ''),
                'lastError': channel['last_error']
            }
        
        return jsonify(response), 200
    
    except Exception as e:
        app.logger.error(f"Error in get_channels: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ─── Database Helper Functions ──────────────────────────────────────

def insert_channel(user_id: str, channel_name: str, config: dict):
    """Insert or update channel configuration in Supabase."""
    try:
        headers = _supabase_headers()
        
        payload = {
            'user_id': user_id,
            'channel_name': channel_name,
            'enabled': config.get('enabled', True),
            'config': config,
            'connected': bool(config.get('botToken') or config.get('botId')),
            'updated_at': 'now()'
        }
        
        # Try upsert (insert or update)
        resp = requests.post(
            f'{SUPABASE_URL}/rest/v1/channels?on_conflict=user_id,channel_name',
            headers=headers,
            json=payload
        )
        
        if not resp.ok:
            app.logger.error(f"Supabase insert error: {resp.text}")
            raise Exception(f"Failed to insert channel: {resp.text}")
        
        app.logger.info(f"✓ Stored {channel_name} config for {user_id}")
        return resp.json()
    
    except Exception as e:
        app.logger.error(f"Error in insert_channel: {e}")
        raise


def query_channels(user_id: str):
    """Query channels for a user from Supabase."""
    try:
        headers = _supabase_headers()
        
        # URL-encode the user_id for the query
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/channels?user_id=eq.{user_id}',
            headers=headers
        )
        
        if not resp.ok:
            app.logger.error(f"Supabase query error: {resp.text}")
            raise Exception(f"Failed to query channels: {resp.text}")
        
        return resp.json()
    
    except Exception as e:
        app.logger.error(f"Error in query_channels: {e}")
        raise


def _supabase_headers():
    """Build Supabase API headers."""
    return {
        'apikey': os.getenv('SUPABASE_ANON_KEY'),
        'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
        'Content-Type': 'application/json'
    }
