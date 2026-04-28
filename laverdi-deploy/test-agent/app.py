"""
Lightweight Test Agent - listens for tasks via HTTP webhook
Executes simple operations and reports status back to command center
"""
import os
import json
import uuid
import logging
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from threading import Thread
import traceback

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
AGENT_ID = os.getenv('AGENT_ID', f'agent-{uuid.uuid4().hex[:8]}')
COMMAND_CENTER_URL = os.getenv('COMMAND_CENTER_URL', 'http://command-center:5000')
AGENT_HOST = os.getenv('AGENT_HOST', 'test-agent')
AGENT_PORT = int(os.getenv('AGENT_PORT', 5001))

# Store task history
task_history = {}

def execute_task(task_id, task_data):
    """Execute a task and report results"""
    try:
        task_type = task_data.get('type')
        params = task_data.get('params', {})
        
        logger.info(f"[{task_id}] Executing task type: {task_type}")
        
        result = None
        error = None
        
        # Execute based on task type
        if task_type == 'echo':
            result = {"message": params.get('message', 'Hello World')}
        
        elif task_type == 'read_file':
            filepath = params.get('path', '/tmp/test.txt')
            try:
                with open(filepath, 'r') as f:
                    result = {"content": f.read(), "path": filepath}
            except Exception as e:
                error = f"Failed to read file: {str(e)}"
        
        elif task_type == 'web_request':
            url = params.get('url')
            if url:
                try:
                    resp = requests.get(url, timeout=10)
                    result = {
                        "status_code": resp.status_code,
                        "url": url,
                        "length": len(resp.content)
                    }
                except Exception as e:
                    error = f"Web request failed: {str(e)}"
            else:
                error = "URL parameter required"
        
        elif task_type == 'system_info':
            result = {
                "agent_id": AGENT_ID,
                "agent_host": AGENT_HOST,
                "agent_port": AGENT_PORT
            }
        
        else:
            error = f"Unknown task type: {task_type}"
        
        # Update task status
        task_history[task_id] = {
            "task_id": task_id,
            "type": task_type,
            "status": "completed" if not error else "failed",
            "result": result,
            "error": error,
            "completed_at": datetime.utcnow().isoformat()
        }
        
        # Report back to command center
        try:
            report_data = {
                "agent_id": AGENT_ID,
                "task_id": task_id,
                "status": "completed" if not error else "failed",
                "result": result,
                "error": error,
                "timestamp": datetime.utcnow().isoformat()
            }
            requests.post(
                f"{COMMAND_CENTER_URL}/api/task-report",
                json=report_data,
                timeout=5
            )
            logger.info(f"[{task_id}] Task result reported to command center")
        except Exception as e:
            logger.error(f"[{task_id}] Failed to report to command center: {str(e)}")
    
    except Exception as e:
        logger.error(f"[{task_id}] Task execution error: {str(e)}")
        task_history[task_id] = {
            "task_id": task_id,
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "agent_id": AGENT_ID,
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/task', methods=['POST'])
def receive_task():
    """Receive and queue a task"""
    try:
        task_data = request.get_json()
        task_id = task_data.get('task_id', str(uuid.uuid4()))
        
        logger.info(f"[{task_id}] Task received: {task_data}")
        
        # Queue task for async execution
        task_history[task_id] = {
            "task_id": task_id,
            "status": "processing",
            "received_at": datetime.utcnow().isoformat()
        }
        
        # Execute task async
        thread = Thread(target=execute_task, args=(task_id, task_data), daemon=True)
        thread.start()
        
        return jsonify({
            "task_id": task_id,
            "status": "accepted",
            "agent_id": AGENT_ID
        }), 202
    
    except Exception as e:
        logger.error(f"Error receiving task: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks and their status"""
    return jsonify({
        "agent_id": AGENT_ID,
        "tasks": list(task_history.values()),
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get specific task status"""
    if task_id in task_history:
        return jsonify(task_history[task_id])
    return jsonify({"error": "Task not found"}), 404

@app.route('/info', methods=['GET'])
def get_info():
    """Get agent info"""
    return jsonify({
        "agent_id": AGENT_ID,
        "agent_host": AGENT_HOST,
        "agent_port": AGENT_PORT,
        "command_center_url": COMMAND_CENTER_URL,
        "tasks_processed": len(task_history),
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    logger.info(f"Starting Test Agent {AGENT_ID}")
    logger.info(f"Command Center: {COMMAND_CENTER_URL}")
    app.run(host='0.0.0.0', port=AGENT_PORT, debug=False)
