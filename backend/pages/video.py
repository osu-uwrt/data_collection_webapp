from flask import render_template, request, redirect, url_for, flash, jsonify
from app_instance import app
from modules.video_processing import get_total_frames
from PIL import Image
import os


@app.route('/video/<video_name>')
def page2(video_name):
    frames_folder = os.path.join(app.root_path, 'data', 'frames', video_name)
    total_frames = get_total_frames(frames_folder)
    
    # Assuming the frames are named in a consistent manner like frame0.jpg, frame1.jpg, etc.
    sample_frame_path = os.path.join(frames_folder, 'frame0.jpg')
    with Image.open(sample_frame_path) as img:
        width, height = img.size

    return jsonify({
        'video_name': video_name,
        'total_frames': total_frames,
        'video_height': height,
        'video_width': width
    })