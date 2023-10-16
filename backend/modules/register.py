from flask import request, jsonify
from app_instance import app
from werkzeug.security import generate_password_hash
import jwt
import sqlite3
import os

SECRET_KEY = 'your_secret_key'
DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

def generate_token(username, user_id, team_id):  # <-- You can reuse this function
    payload = {
        "username": username,
        "user_id": user_id,
        "team_id": team_id
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

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
    
    # Convert username to lowercase
    username = username.lower()

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

    user_id = c.lastrowid
    print(user_id)

    token = generate_token(username, user_id, team_id=None)
    
    conn.commit()
    conn.close()

    return jsonify({"token": token, "msg": "User registered successfully"}), 201

@app.route('/register-team', methods=['POST'])
def team_register():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    team_name_reference = request.json.get('team_name_reference', None)
    team_name_display = request.json.get('team_name_display', None)
    owner_id = request.json.get('owner_id', None)
    
    if not team_name_reference or not team_name_display or not owner_id:
        return jsonify({"msg": "Missing team_name_reference, team_name_display, or owner_id"}), 400

    # Convert team_name_reference to lowercase
    team_name_reference = team_name_reference.lower().replace(" ", "_")

    conn = get_db_conn()
    c = conn.cursor()

    # Check if team name reference already exists
    c.execute('SELECT team_name_reference FROM Team WHERE team_name_reference = ?', (team_name_reference,))
    existing_team = c.fetchone()
    if existing_team:
        conn.close()
        return jsonify({"msg": "Team name already taken"}), 400

    # Insert the new team into DB
    c.execute('''
        INSERT INTO Team (team_name_reference, team_name_display, owner_id)
        VALUES (?, ?, ?)
    ''', (team_name_reference, team_name_display, owner_id))

    # Get the ID of the newly inserted team
    team_id = c.lastrowid

    # Set the user's team_id in the Users table
    c.execute('''
        UPDATE Users SET team_id = ? WHERE user_id = ?
    ''', (team_id, owner_id))

    # Fetch the username of the owner
    c.execute('SELECT username FROM Users WHERE user_id = ?', (owner_id,))
    owner_data = c.fetchone()
    owner_username = owner_data[0] if owner_data else None

    conn.commit()
    conn.close()

    if not owner_username:
        return jsonify({"msg": "Error: User not found"}), 500

    # Generate the token
    token = generate_token(owner_username, owner_id, team_id)

    return jsonify({"token": token, "msg": "Team registered successfully"}), 201
