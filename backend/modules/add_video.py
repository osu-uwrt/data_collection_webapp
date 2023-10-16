# add-video.py
from flask import request, jsonify
from modules.video_processing import save_and_extract_frames
from app_instance import app

@app.route('/add-video', methods=['POST'])
def add_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video_file = request.files['video']
    team_id = request.form.get('team_id')  # Assuming team_id will be passed as form data. If not, adjust accordingly.

    if not team_id:
        return jsonify({'error': 'No team_id provided'}), 400

    try:
        video_id = save_and_extract_frames(video_file, team_id)  # Pass the team_id to the function
        return jsonify({'success': True, 'video_id': video_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500