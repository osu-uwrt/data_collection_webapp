import os
import cv2
from app_instance import app

def save_and_extract_frames(video_file):
    root_data_dir = os.path.join("backend", "data")
    
    upload_dir = os.path.join(root_data_dir, "uploads")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    video_save_path = os.path.join(upload_dir, video_file.filename)
    video_file.save(video_save_path)

    video_name = os.path.splitext(video_file.filename)[0] 
    frames_dir = os.path.join(root_data_dir, "frames", video_name)
    if not os.path.exists(frames_dir):
        os.makedirs(frames_dir)

    vidcap = cv2.VideoCapture(video_save_path)
    success, image = vidcap.read()
    count = 0
    while success:
        frame_file = os.path.join(frames_dir, f"frame{count}.jpg")
        cv2.imwrite(frame_file, image)
        success, image = vidcap.read()
        count += 1

def get_total_frames(video_name):
    frames_directory = os.path.join("backend", "data", "frames", video_name)
    return len([f for f in os.listdir(frames_directory) if f.endswith('.jpg')])

def get_uploaded_videos():
    base_path = os.path.join("backend", 'data', 'frames')
    video_names = os.listdir(base_path)
    return video_names
