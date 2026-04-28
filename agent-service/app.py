from flask import Flask, request, jsonify
import subprocess
import json
import sqlite3
import uuid
from datetime import datetime
import requests
import threading

app = Flask(__name__)
DB_FILE = '/app/tasks.db'

# Initialize database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id TEXT PRIMARY KEY, name TEXT, command TEXT, args TEXT, 
                  status TEXT, output TEXT, created_at TEXT, completed_at TEXT)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

@app.route('/tasks', methods=['GET'])
def list_tasks():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50')
    tasks = [{'id': row[0], 'name': row[1], 'command': row[2], 'args': row[3], 
              'status': row[4], 'output': row[5], 'created_at': row[6], 'completed_at': row[7]} 
             for row in c.fetchall()]
    conn.close()
    return jsonify({'tasks': tasks}), 200

@app.route('/task', methods=['POST'])
def execute_task():
    data = request.json
    task_id = str(uuid.uuid4())
    name = data.get('name', 'unknown')
    command = data.get('command', '')
    args = data.get('args', '')
    callback_url = data.get('callback_url', None)
    
    # Store task in DB
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              (task_id, name, command, args, 'running', '', datetime.now().isoformat(), None))
    conn.commit()
    conn.close()
    
    # Execute task in background thread
    def run_task():
        try:
            full_command = f"{command} {args}".strip()
            result = subprocess.run(full_command, shell=True, capture_output=True, text=True, timeout=30)
            output = result.stdout + result.stderr
            status = 'completed'
        except subprocess.TimeoutExpired:
            output = 'Task timed out after 30 seconds'
            status = 'failed'
        except Exception as e:
            output = str(e)
            status = 'failed'
        
        # Update DB
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('UPDATE tasks SET status = ?, output = ?, completed_at = ? WHERE id = ?',
                  (status, output, datetime.now().isoformat(), task_id))
        conn.commit()
        conn.close()
        
        # Callback to command center if provided
        if callback_url:
            try:
                requests.post(callback_url, json={'task_id': task_id, 'status': status, 'output': output}, timeout=5)
            except:
                pass
    
    thread = threading.Thread(target=run_task)
    thread.start()
    
    return jsonify({'task_id': task_id, 'status': 'queued'}), 202

@app.route('/task/<task_id>', methods=['GET'])
def get_task(task_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify({'id': row[0], 'name': row[1], 'command': row[2], 'args': row[3],
                    'status': row[4], 'output': row[5], 'created_at': row[6], 'completed_at': row[7]}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
