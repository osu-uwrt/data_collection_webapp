# modules/video_serving.py
import os
from flask import send_from_directory, abort, jsonify
from app_instance import app
import json

print("Loading video_serving module")

@app.route('/data/frames/<video_name>/<filename>')
def serve_frame(video_name, filename):
    directory_path = os.path.join(app.root_path, 'data', 'frames', video_name)
    
    # Check if the file exists
    full_path = os.path.join(directory_path, filename)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        abort(404)
    
    return send_from_directory(directory_path, filename)

@app.route('/data/frames/<video_name>/boxes.json', methods=['GET'])
def get_boxes(video_name):
    path = os.path.join("backend","data", "frames", video_name, "boxes.json")

    if os.path.exists(path):
        with open(path, 'r') as f:
            boxes_data = json.load(f)
        return jsonify(boxes_data)
    else:
        return jsonify({"error": "Boxes data not found for this video"}), 404
