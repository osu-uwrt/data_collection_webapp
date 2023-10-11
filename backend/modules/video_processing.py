import os
import cv2
import sqlite3
from app_instance import app

DB_PATH = os.path.join(os.getcwd(), "backend/data/db/data.db")

def get_db_conn():
    return sqlite3.connect(DB_PATH)

def save_and_extract_frames(video_file):
    root_data_dir = os.path.join("backend", "data")
    
    upload_dir = os.path.join(root_data_dir, "uploads")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    video_name = os.path.splitext(video_file.filename)[0]  # Extract the original video name

    # Create a temporary save path for the video
    temp_video_save_path = os.path.join(upload_dir, video_file.filename)
    video_file.save(temp_video_save_path)
    
    vidcap = cv2.VideoCapture(temp_video_save_path)
    video_width = int(vidcap.get(cv2.CAP_PROP_FRAME_WIDTH))
    video_height = int(vidcap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Add video details to SQLite database
    conn = get_db_conn()
    c = conn.cursor()
    c.execute('''
        INSERT INTO Video (video_name, video_width, video_height) VALUES (?, ?, ?)
    ''', (video_name, video_width, video_height))
    video_id = c.lastrowid  # Get the last inserted ID
    conn.commit()
    conn.close()

    # Update video_save_path to save using video_id instead of the original filename
    video_extension = os.path.splitext(video_file.filename)[1]  # Extract the file extension
    video_save_path = os.path.join(upload_dir, f"{video_id}{video_extension}")
    os.rename(temp_video_save_path, video_save_path)  # Rename the saved video file with the new name

    # Now use the video_id for the frames directory instead of the video_name
    frames_dir = os.path.join(root_data_dir, "frames", str(video_id))
    if not os.path.exists(frames_dir):
        os.makedirs(frames_dir)

    success, image = vidcap.read()
    count = 0
    while success:
        frame_file = os.path.join(frames_dir, f"frame{count}.jpg")
        cv2.imwrite(frame_file, image)
        success, image = vidcap.read()
        count += 1
        
    return video_id



def get_total_frames(video_id):  # Updated parameter name to video_id
    frames_directory = os.path.join("backend", "data", "frames", str(video_id))  # Use str(video_id)
    return len([f for f in os.listdir(frames_directory) if f.endswith('.jpg')])

def get_uploaded_videos():
    base_path = os.path.join("backend", 'data', 'frames')
    video_ids = os.listdir(base_path)  # These will now be video IDs
    
    # Connect to SQLite database to fetch video names
    conn = get_db_conn()
    c = conn.cursor()
    
    videos = []  # List to store matched video IDs and names

    for video_id in video_ids:
        c.execute("SELECT video_name FROM Video WHERE video_id=?", (video_id,))
        result = c.fetchone()
        if result:
            video_name = result[0]
            videos.append({"video_id": video_id, "video_name": video_name})

    conn.close()
    return videos

