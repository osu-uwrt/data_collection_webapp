from flask import Flask, jsonify, send_from_directory, abort
import sqlite3
import os
from app_instance import app

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

@app.route('/teams', methods=['GET'])
def get_teams():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT team_id, team_name_display, thumbnail FROM Team")  # Adjusted column name here
    teams = cursor.fetchall()
    conn.close()

    # Convert the teams to a list of dictionaries for JSON serialization
    teams_list = [{"team_id": t[0], "team_name": t[1], "thumbnail": t[2]} for t in teams]
    
    return jsonify(teams_list)


@app.route('/data/teams/<int:team_id>/<filename>')
def serve_team_image(team_id, filename):
    directory_path = os.path.join(app.root_path, 'data', 'teams', str(team_id))
    
    # Check if the file exists
    full_path = os.path.join(directory_path, filename)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        abort(404)
    
    return send_from_directory(directory_path, filename)
