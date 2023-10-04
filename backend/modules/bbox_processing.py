# modules/bbox_processing.py
import os
from flask import request, jsonify
from app_instance import app
import json

print("Loading bbox processing module")

@app.route('/save-boxes', methods=['POST'])
def save_boxes():
    boxes_data = request.json

    video_name = boxes_data.get('video_name')
    if not video_name:
        return jsonify({"status": "error", "message": "Video name not provided!"}), 400

    save_path = os.path.join("backend", "data", "frames", video_name, "boxes.json")

    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    print(boxes_data)

    print("Saving to:", save_path)
    with open(save_path, 'w') as f:
        json.dump(boxes_data, f)



    return jsonify({"status": "success", "message": "Boxes saved successfully!"})
