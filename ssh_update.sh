#!/bin/bash
# Update command-center.py on remote server

HOST="66.42.70.66"
USER="root"
PASS="F,6f\$)bZKYr9CTDN"

# Create the new endpoint functions to insert
NEW_ENDPOINTS='# Channel Management Endpoints
@app.route('"'"'/api/configure-channels'"'"', methods=['"'"'POST'"'"'])
def configure_channels():
    """Configure a communication channel (Telegram, Discord, etc.)"""
    try:
        data = request.json
        user_id = data.get('"'"'user_id'"'"')
        platform = data.get('"'"'platform'"'"')  # '"'"'telegram'"'"', '"'"'discord'"'"', etc.
        token = data.get('"'"'token'"'"')
        
        if not all([user_id, platform, token]):
            return {'"'"'error'"'"': '"'"'Missing required fields'"'"'}, 400
        
        # Insert into Supabase using service role key
        supabase = create_client(
            '"'"'https://dcvrkpgvxqdcboostkpz.supabase.co'"'"',
            '"'"'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'"'"'
        )
        
        result = supabase.table('"'"'channels'"'"').upsert({
            '"'"'user_id'"'"': user_id,
            '"'"'platform'"'"': platform,
            '"'"'token'"'"': token,
            '"'"'verified'"'"': True,
            '"'"'verified_at'"'"': datetime.utcnow().isoformat()
        }).execute()
        
        return {'"'"'success'"'"': True, '"'"'data'"'"': result.data}, 200
    except Exception as e:
        return {'"'"'error'"'"': str(e)}, 500

@app.route('"'"'/api/get-channels'"'"', methods=['"'"'POST'"'"'])
def get_channels():
    """Get user'"'"'s configured channels"""
    try:
        data = request.json
        user_id = data.get('"'"'user_id'"'"')
        
        if not user_id:
            return {'"'"'error'"'"': '"'"'Missing user_id'"'"'}, 400
        
        supabase = create_client(
            '"'"'https://dcvrkpgvxqdcboostkpz.supabase.co'"'"',
            '"'"'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'"'"'
        )
        
        result = supabase.table('"'"'channels'"'"').select('"'"'*'"'"').eq('"'"'user_id'"'"', user_id).execute()
        return {'"'"'channels'"'"': result.data}, 200
    except Exception as e:
        return {'"'"'error'"'"': str(e)}, 500

@app.route('"'"'/api/delete-channel'"'"', methods=['"'"'POST'"'"'])
def delete_channel():
    """Delete a channel configuration"""
    try:
        data = request.json
        user_id = data.get('"'"'user_id'"'"')
        platform = data.get('"'"'platform'"'"')
        
        if not all([user_id, platform]):
            return {'"'"'error'"'"': '"'"'Missing required fields'"'"'}, 400
        
        supabase = create_client(
            '"'"'https://dcvrkpgvxqdcboostkpz.supabase.co'"'"',
            '"'"'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'"'"'
        )
        
        supabase.table('"'"'channels'"'"').delete().eq('"'"'user_id'"'"', user_id).eq('"'"'platform'"'"', platform).execute()
        return {'"'"'success'"'"': True}, 200
    except Exception as e:
        return {'"'"'error'"'"': str(e)}, 500
'

echo "Script created. To execute, install sshpass and run:"
echo "sshpass -p 'F,6f$)bZKYr9CTDN' ssh root@66.42.70.66 'cat /root/command-center.py | head -20'"
