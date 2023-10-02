import os
import cv2
from app_instance import app

def save_and_extract_frames(video_file):
    # Define the root directory for data
    root_data_dir = "data"
    
    # Ensure the 'data/uploads' directory exists
    upload_dir = os.path.join(root_data_dir, "uploads")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Define where to save the uploaded video
    video_save_path = os.path.join(upload_dir, video_file.filename)
    video_file.save(video_save_path)

    # Create a subdirectory inside 'data/frames' named after the video filename (without extension)
    video_name = os.path.splitext(video_file.filename)[0] # This gets the name without extension
    frames_dir = os.path.join(root_data_dir, "frames", video_name)
    if not os.path.exists(frames_dir):
        os.makedirs(frames_dir)

    # Now extract frames and save them in the new directory
    vidcap = cv2.VideoCapture(video_save_path)
    success, image = vidcap.read()
    count = 0
    while success:
        frame_file = os.path.join(frames_dir, f"frame{count}.jpg")
        cv2.imwrite(frame_file, image)
        success, image = vidcap.read()
        count += 1

def get_total_frames(video_name):
    frames_directory = os.path.join("data", "frames", video_name)
    return len([f for f in os.listdir(frames_directory) if f.endswith('.jpg')])

def get_uploaded_videos():
    base_path = os.path.join(app.root_path, 'data', 'frames')
    video_names = os.listdir(base_path)
    return video_names
