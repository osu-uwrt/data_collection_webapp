import os
from flask import request, jsonify
from app_instance import app
import sqlite3

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

print("Loading bbox processing module")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

@app.route('/save-boxes', methods=['POST'])
def save_boxes():
    boxes_data = request.json

    # Get video_id from payload
    video_id = boxes_data.get('video_id')
    if not video_id:
        return jsonify({"status": "error", "message": "Video ID not provided!"}), 400

    # Connect to the SQLite database
    conn = get_db_conn()
    c = conn.cursor()

    # Check if the video_id already exists, if not throw an error
    c.execute("SELECT video_id FROM Video WHERE video_id=?", (video_id,))
    if not c.fetchone():
        conn.close()
        return jsonify({"status": "error", "message": f"No data found for video with ID: {video_id}"}), 404

    # Start transaction
    conn.execute('BEGIN TRANSACTION;')
    try:
        # Delete existing bounding boxes for the video_id
        c.execute("DELETE FROM BoundingBox WHERE video_id=?", (video_id,))

        # Insert new bounding boxes
        for frame_number, boxes in boxes_data['boxes'].items():
            for box in boxes:
                c.execute('''
                    INSERT INTO BoundingBox (video_id, frame_number, class, displayOrder, height, width, x, y, interpolate, interpolationID, interpolationNumber, visible)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (video_id, frame_number, box['class'], box['displayOrder'], box['height'], box['width'], box['x'], box['y'], box['interpolate'], box['interpolationID'], box['interpolationNumber'], box['visible']))

        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Boxes saved successfully!"})

    except Exception as e:
        conn.rollback()
        print("Error while saving boxes:", e)
        return jsonify({"status": "error", "message": "An error occurred while saving boxes."}), 500
