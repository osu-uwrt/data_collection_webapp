from flask import Flask, jsonify
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
    cursor.execute("SELECT team_id, team_name, thumbnail FROM Team")
    teams = cursor.fetchall()
    conn.close()

    # Convert the teams to a list of dictionaries for JSON serialization
    teams_list = [{"team_id": t[0], "team_name": t[1], "thumbnail": t[2]} for t in teams]
    
    return jsonify(teams_list)
