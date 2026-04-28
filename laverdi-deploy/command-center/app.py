"""
Lightweight OpenClaw Command Center
Manages agents, sends tasks, monitors status
"""
import os
import json
import uuid
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import requests
from threading import Lock

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thread-safe storage
agents = {}
tasks = {}
agents_lock = Lock()
tasks_lock = Lock()

# Configuration
COMMAND_CENTER_URL = os.getenv('COMMAND_CENTER_URL', 'http://localhost:5000')
COMMAND_CENTER_PORT = int(os.getenv('COMMAND_CENTER_PORT', 5000))

@app.route('/', methods=['GET'])
def dashboard():
    """Serve the dashboard"""
    with agents_lock:
        agent_list = list(agents.values())
    with tasks_lock:
        task_list = list(tasks.values())
    
    return render_template('dashboard.html', 
                         agents=agent_list,
                         tasks=task_list,
                         total_agents=len(agent_list),
                         total_tasks=len(task_list))

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "agents_count": len(agents),
        "tasks_count": len(tasks)
    })

@app.route('/api/agents', methods=['GET'])
def get_agents():
    """List all registered agents"""
    with agents_lock:
        return jsonify({
            "agents": list(agents.values()),
            "count": len(agents),
            "timestamp": datetime.utcnow().isoformat()
        })

@app.route('/api/agents/register', methods=['POST'])
def register_agent():
    """Register or update an agent"""
    try:
        data = request.get_json()
        agent_id = data.get('agent_id')
        agent_url = data.get('agent_url')
        
        if not agent_id or not agent_url:
            return jsonify({"error": "agent_id and agent_url required"}), 400
        
        with agents_lock:
            agents[agent_id] = {
                "agent_id": agent_id,
                "agent_url": agent_url,
                "status": "online",
                "registered_at": datetime.utcnow().isoformat(),
                "last_heartbeat": datetime.utcnow().isoformat(),
                "tasks_count": 0
            }
        
        logger.info(f"Agent registered: {agent_id} at {agent_url}")
        return jsonify({"status": "registered", "agent_id": agent_id}), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """List all tasks"""
    with tasks_lock:
        return jsonify({
            "tasks": list(tasks.values()),
            "count": len(tasks),
            "timestamp": datetime.utcnow().isoformat()
        })

@app.route('/api/tasks/create', methods=['POST'])
def create_task():
    """Create and send a task to an agent"""
    try:
        data = request.get_json()
        agent_id = data.get('agent_id')
        task_type = data.get('type')
        params = data.get('params', {})
        
        if not agent_id or not task_type:
            return jsonify({"error": "agent_id and type required"}), 400
        
        with agents_lock:
            if agent_id not in agents:
                return jsonify({"error": f"Agent {agent_id} not found"}), 404
            agent = agents[agent_id]
        
        # Create task
        task_id = str(uuid.uuid4())
        task_payload = {
            "task_id": task_id,
            "type": task_type,
            "params": params
        }
        
        # Store task
        with tasks_lock:
            tasks[task_id] = {
                "task_id": task_id,
                "agent_id": agent_id,
                "type": task_type,
                "params": params,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
                "result": None,
                "error": None
            }
        
        # Send to agent
        try:
            response = requests.post(
                f"{agent['agent_url']}/task",
                json=task_payload,
                timeout=10
            )
            
            if response.status_code in [200, 202]:
                with tasks_lock:
                    tasks[task_id]["status"] = "sent"
                logger.info(f"Task {task_id} sent to agent {agent_id}")
            else:
                with tasks_lock:
                    tasks[task_id]["status"] = "failed"
                    tasks[task_id]["error"] = f"Agent returned {response.status_code}"
        
        except Exception as e:
            with tasks_lock:
                tasks[task_id]["status"] = "failed"
                tasks[task_id]["error"] = str(e)
            logger.error(f"Failed to send task to agent: {str(e)}")
        
        return jsonify({
            "task_id": task_id,
            "agent_id": agent_id,
            "status": tasks[task_id]["status"]
        }), 202
    
    except Exception as e:
        logger.error(f"Task creation error: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get specific task status"""
    with tasks_lock:
        if task_id in tasks:
            return jsonify(tasks[task_id])
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/task-report', methods=['POST'])
def task_report():
    """Receive task completion report from agent"""
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        agent_id = data.get('agent_id')
        status = data.get('status')
        result = data.get('result')
        error = data.get('error')
        
        if not task_id:
            return jsonify({"error": "task_id required"}), 400
        
        with tasks_lock:
            if task_id in tasks:
                tasks[task_id]["status"] = status
                tasks[task_id]["result"] = result
                tasks[task_id]["error"] = error
                tasks[task_id]["completed_at"] = datetime.utcnow().isoformat()
                logger.info(f"Task {task_id} reported: {status}")
            else:
                logger.warning(f"Unknown task reported: {task_id}")
        
        # Update agent heartbeat
        with agents_lock:
            if agent_id in agents:
                agents[agent_id]["last_heartbeat"] = datetime.utcnow().isoformat()
        
        return jsonify({"status": "acknowledged"}), 200
    
    except Exception as e:
        logger.error(f"Report error: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route('/api/agents/<agent_id>/health', methods=['GET'])
def agent_health(agent_id):
    """Check specific agent health"""
    with agents_lock:
        if agent_id not in agents:
            return jsonify({"error": "Agent not found"}), 404
        agent = agents[agent_id]
    
    try:
        response = requests.get(
            f"{agent['agent_url']}/health",
            timeout=5
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"status": "unreachable", "error": str(e)}), 503

if __name__ == '__main__':
    logger.info("Starting OpenClaw Command Center")
    app.run(host='0.0.0.0', port=COMMAND_CENTER_PORT, debug=False)
