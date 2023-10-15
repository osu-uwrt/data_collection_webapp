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

@app.route('/teams/<int:team_id>', methods=['GET'])
def get_team_by_id(team_id):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT team_id, team_name_display, thumbnail FROM Team WHERE team_id = ?", (team_id,))
    team = cursor.fetchone()
    conn.close()

    # If team does not exist, return 404
    if team is None:
        abort(404)

    # Convert the team tuple to a dictionary for JSON serialization
    team_dict = {"team_id": team[0], "team_name": team[1], "thumbnail": team[2]}
    
    return jsonify(team_dict)

@app.route('/team/<int:team_id>/videos', methods=['GET'])
def get_videos_for_team(team_id):
    conn = get_db_conn()
    cursor = conn.cursor()

    # Assuming you have a video table with a foreign key column for the team_id
    cursor.execute("SELECT video_id, video_name FROM Video WHERE team_id = ?", (team_id,))
    videos = cursor.fetchall()
    
    conn.close()

    # Convert the videos to a list of dictionaries for JSON serialization
    videos_list = [{"video_id": v[0], "video_name": v[1]} for v in videos]
    
    return jsonify(videos_list)

@app.route('/team/name/<string:team_name_reference>', methods=['GET'])
def get_team_by_name(team_name_reference):
    conn = get_db_conn()
    cursor = conn.cursor()

    # Fetch the team based on the team_name_reference
    cursor.execute("SELECT team_id FROM Team WHERE team_name_reference = ?", (team_name_reference,))
    team = cursor.fetchone()

    conn.close()

    # If the team does not exist based on the team_name_reference, return a 404
    if team is None:
        abort(404)

    # Convert the team tuple to a dictionary for JSON serialization
    team_dict = {"team_id": team[0]}
    
    return jsonify(team_dict)
