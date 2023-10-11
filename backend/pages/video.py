from flask import render_template, request, redirect, url_for, flash, jsonify
from app_instance import app
from modules.video_processing import get_total_frames
import os
import sqlite3

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_connection():
    return sqlite3.connect(DB_PATH)


@app.route('/video/<int:video_id>')
def page2(video_id):
    # Connect to the database
    conn = get_db_connection()
    c = conn.cursor()
    
    # Fetch the video details from the Video table using the video_id
    c.execute("SELECT video_name, video_width, video_height FROM Video WHERE video_id=?", (video_id,))
    row = c.fetchone()
    
    if row is None:
        # Close the connection and return an error if the video_id is not found in the table
        conn.close()
        return jsonify({"status": "error", "message": f"No data found for video with ID: {video_id}"}), 404

    video_name, video_width, video_height = row
    
    frames_folder = os.path.join(app.root_path, 'data', 'frames', str(video_id))

    total_frames = get_total_frames(frames_folder)

    # Close the database connection
    conn.close()

    return jsonify({
        'video_id': video_id,
        'video_name': video_name,
        'total_frames': total_frames,
        'video_height': video_height,
        'video_width': video_width
    })
