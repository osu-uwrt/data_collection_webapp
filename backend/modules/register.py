from flask import request, jsonify
from app_instance import app
from werkzeug.security import generate_password_hash
import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

@app.route('/register', methods=['OPTIONS'])
def register_options():
    return '', 200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
    }


@app.route('/register', methods=['POST'])
def register():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    username = request.json.get('username', None)
    password = request.json.get('password', None)
    email = request.json.get('email', None)
    
    if not username or not password or not email:
        return jsonify({"msg": "Missing username, password, or email"}), 400

    conn = get_db_conn()
    c = conn.cursor()

    # Check if user already exists based on username
    c.execute('SELECT username FROM Users WHERE username = ?', (username,))
    existing_user = c.fetchone()
    if existing_user:
        conn.close()
        return jsonify({"msg": "Username already taken"}), 400

    # Check if email already exists
    c.execute('SELECT email FROM Users WHERE email = ?', (email,))
    existing_email = c.fetchone()
    if existing_email:
        conn.close()
        return jsonify({"msg": "Email already in use"}), 400

    # Hash the password and save to DB
    hashed_password = generate_password_hash(password, method='sha256')
    
    c.execute('''
        INSERT INTO Users (username, hashed_password, email)
        VALUES (?, ?, ?)
    ''', (username, hashed_password, email))
    
    conn.commit()
    conn.close()

    return jsonify({"msg": "User registered successfully"}), 201
