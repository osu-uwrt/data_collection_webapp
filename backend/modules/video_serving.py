# modules/video_serving.py
import os
import sqlite3
from flask import send_from_directory, abort, jsonify
from app_instance import app
import json

print("Loading video_serving module")

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

@app.route('/data/frames/<int:video_id>/<filename>')
def serve_frame(video_id, filename):
    directory_path = os.path.join(app.root_path, 'data', 'frames', str(video_id))
    
    # Check if the file exists
    full_path = os.path.join(directory_path, filename)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        abort(404)
    
    return send_from_directory(directory_path, filename)

@app.route('/data/frames/<int:video_id>/boxes.json', methods=['GET'])
def get_boxes(video_id):
    # No longer using the file path, so the following line is not needed
    # path = os.path.join("backend","data", "frames", video_name, "boxes.json")

    conn = get_db_conn()
    c = conn.cursor()
    
    c.execute('''
        SELECT frame_number, class, displayOrder, height, width, x, y, interpolate, interpolationID, interpolationNumber, visible
        FROM BoundingBox
        WHERE video_id = ?
    ''', (video_id,))
    
    boxes_data_db = c.fetchall()
    conn.close()

    # Convert the data from the database to a structured JSON format
    boxes_data = {"video_id": video_id, "boxes": {}}
    for row in boxes_data_db:
        frame_num = str(row[0])
        if frame_num not in boxes_data["boxes"]:
            boxes_data["boxes"][frame_num] = []
        
        box_info = {
            "class": row[1],
            "displayOrder": row[2],
            "height": row[3],
            "width": row[4],
            "x": row[5],
            "y": row[6],
            "interpolate": bool(row[7]),
            "interpolationID": row[8],
            "interpolationNumber": row[9],
            "visible": bool(row[10])
        }
        boxes_data["boxes"][frame_num].append(box_info)

    if boxes_data["boxes"]:
        return jsonify(boxes_data)
    else:
        return jsonify({"error": "Boxes data not found for this video"}), 404

@app.route('/data/frames/<int:video_id>/polygons.json', methods=['GET'])
def get_polygons(video_id):
    conn = get_db_conn()
    c = conn.cursor()

    c.execute('''
        SELECT frame_number, class, displayOrder, points, interpolate, interpolationID, interpolationNumber, visible
        FROM Polygon
        WHERE video_id = ?
    ''', (video_id,))

    polygons_data_db = c.fetchall()
    conn.close()

    polygons_data = {"video_id": video_id, "polygons": {}}
    for row in polygons_data_db:
        frame_num = str(row[0])
        if frame_num not in polygons_data["polygons"]:
            polygons_data["polygons"][frame_num] = []

        # Parsing the points string into a list of coordinate dictionaries
        points_list = row[3].split(';')
        points = [{'x': float(coord.split(',')[0]), 'y': float(coord.split(',')[1])} for coord in points_list if coord]

        polygon_info = {
            "class": row[1],
            "displayOrder": row[2],
            "points": points,  # Updated to use the parsed points
            "interpolate": bool(row[4]),
            "interpolationID": row[5],
            "interpolationNumber": row[6],
            "visible": bool(row[7])
        }
        polygons_data["polygons"][frame_num].append(polygon_info)

    if polygons_data["polygons"]:
        return jsonify(polygons_data)
    else:
        return jsonify({"error": "Polygon data not found for this video"}), 404


@app.route('/data/classes', methods=['GET'])
def get_classes():
    conn = get_db_conn()
    c = conn.cursor()
    
    c.execute('SELECT class_id, class_name FROM Classes')
    
    classes_data_db = c.fetchall()
    conn.close()

    # Now, we'll create a dictionary where class_id is the key and class_name is the value.
    classes_data = {str(row[0]): row[1] for row in classes_data_db}

    if classes_data:
        return jsonify(classes_data)
    else:
        return jsonify({"error": "No classes found"}), 404


