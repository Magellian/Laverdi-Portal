#!/usr/bin/env python3
"""
Agent Service - Flask app that executes tasks and reports to Command Center
Listens on port 5000, executes tasks, stores results in SQLite
"""
import os
import json
import sqlite3
import subprocess
import requests
import logging
from datetime import datetime
from threading import Thread
from flask import Flask, request, jsonify

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Database setup
DB_PATH = '/app/data/agent.db'
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            name TEXT,
            command TEXT,
            args TEXT,
            status TEXT,
            result TEXT,
            created_at TEXT,
            completed_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def execute_task(task_id, name, command, args, callback_url=None):
    """Execute task in background and report results"""
    try:
        # Update task status to running
        conn = get_db()
        c = conn.cursor()
        c.execute("UPDATE tasks SET status = ? WHERE id = ?", ("running", task_id))
        conn.commit()
        conn.close()
        
        logger.info(f"Executing task {task_id}: {name} - Command: {command}")
        
        # Execute command
        if isinstance(args, str):
            args_list = args.split()
        else:
            args_list = args if isinstance(args, list) else []
        
        result = subprocess.run(
            [command] + args_list,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Prepare result
        result_data = {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
        
        # Update task in database
        conn = get_db()
        c = conn.cursor()
        c.execute(
            "UPDATE tasks SET status = ?, result = ?, completed_at = ? WHERE id = ?",
            ("completed", json.dumps(result_data), datetime.utcnow().isoformat(), task_id)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Task {task_id} completed with return code {result.returncode}")
        
        # Report back to command center if callback provided
        if callback_url:
            try:
                requests.post(
                    callback_url,
                    json={
                        "id": task_id,
                        "name": name,
                        "status": "completed",
                        "result": result_data,
                        "completed_at": datetime.utcnow().isoformat()
                    },
                    timeout=10
                )
                logger.info(f"Reported task {task_id} result to command center")
            except Exception as e:
                logger.error(f"Failed to report task result: {e}")
        
    except subprocess.TimeoutExpired:
        error_msg = "Task timed out after 30 seconds"
        logger.error(f"Task {task_id} timed out")
        conn = get_db()
        c = conn.cursor()
        c.execute(
            "UPDATE tasks SET status = ?, result = ?, completed_at = ? WHERE id = ?",
            ("failed", json.dumps({"error": error_msg}), datetime.utcnow().isoformat(), task_id)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Task {task_id} failed: {e}")
        conn = get_db()
        c = conn.cursor()
        c.execute(
            "UPDATE tasks SET status = ?, result = ?, completed_at = ? WHERE id = ?",
            ("failed", json.dumps({"error": error_msg}), datetime.utcnow().isoformat(), task_id)
        )
        conn.commit()
        conn.close()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()}), 200

@app.route('/task', methods=['POST'])
def create_task():
    """Receive and execute a task"""
    try:
        data = request.get_json()
        
        task_id = data.get('id')
        name = data.get('name', 'unnamed')
        command = data.get('command')
        args = data.get('args', [])
        callback_url = data.get('callback_url')
        
        if not task_id or not command:
            return jsonify({"error": "Missing required fields: id, command"}), 400
        
        # Store task in database
        conn = get_db()
        c = conn.cursor()
        c.execute(
            "INSERT INTO tasks (id, name, command, args, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (task_id, name, command, json.dumps(args), "pending", datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Task {task_id} received: {name}")
        
        # Execute task in background
        thread = Thread(target=execute_task, args=(task_id, name, command, args, callback_url))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            "id": task_id,
            "status": "pending",
            "message": "Task queued for execution"
        }), 202
    
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/tasks', methods=['GET'])
def list_tasks():
    """List all tasks"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50")
        rows = c.fetchall()
        conn.close()
        
        tasks = []
        for row in rows:
            task = {
                "id": row["id"],
                "name": row["name"],
                "command": row["command"],
                "args": json.loads(row["args"]),
                "status": row["status"],
                "result": json.loads(row["result"]) if row["result"] else None,
                "created_at": row["created_at"],
                "completed_at": row["completed_at"]
            }
            tasks.append(task)
        
        return jsonify({"tasks": tasks}), 200
    
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/task/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get specific task details"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            return jsonify({"error": "Task not found"}), 404
        
        task = {
            "id": row["id"],
            "name": row["name"],
            "command": row["command"],
            "args": json.loads(row["args"]),
            "status": row["status"],
            "result": json.loads(row["result"]) if row["result"] else None,
            "created_at": row["created_at"],
            "completed_at": row["completed_at"]
        }
        
        return jsonify(task), 200
    
    except Exception as e:
        logger.error(f"Error getting task: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
