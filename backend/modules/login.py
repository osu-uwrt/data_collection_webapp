from flask import request, jsonify
from app_instance import app
from werkzeug.security import check_password_hash
import jwt
import os
import sqlite3

SECRET_KEY = 'your_secret_key'  # Choose a secret key and keep it safe

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

def generate_token(username, user_id, team_id):
    payload = {
        "username": username,
        "user_id": user_id,
        "team_id": team_id
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

@app.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    username = request.json.get('username', None)
    password = request.json.get('password', None)
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    # Convert username to lowercase for the database check
    db_username = username.lower()

    conn = get_db_conn()
    c = conn.cursor()

    # Check if user exists based on username
    c.execute('SELECT user_id, username, hashed_password, team_id FROM Users WHERE username = ?', (db_username,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"msg": "Invalid credentials"}), 401

    # Check if password is correct
    stored_hashed_password = user[2]
    if not check_password_hash(stored_hashed_password, password):
        conn.close()
        return jsonify({"msg": "Invalid credentials"}), 401
    
    user_id = user[0]
    team_id = user[3]
    # Generate JWT token
    token = generate_token(username, user_id, team_id)
    
    conn.close()

    return jsonify({"token": token, "msg": "Login successful"}), 200
