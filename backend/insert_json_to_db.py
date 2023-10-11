import sqlite3
import os
import json

DB_DIR = os.path.join(os.getcwd(), "backend/data/db")
DB_PATH = os.path.join(DB_DIR, 'data.db')

def insert_bounding_box_data_from_file(json_file_path):
    # Parse the JSON file
    with open(json_file_path, 'r') as file:
        json_data = json.load(file)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    video_id = json_data['video_id']
    video_name = json_data['video_name']

    # Check if the video_id already exists in the 'video' table
    c.execute("SELECT id FROM video WHERE id=?", (video_id,))
    result = c.fetchone()
    if not result:
        # Insert the video if it doesn't exist
        c.execute("INSERT INTO video (id, title) VALUES (?, ?)", (video_id, video_name))

    # Insert into video_data
    c.execute("INSERT INTO video_data (video_id, video_name) VALUES (?, ?)", (video_id, video_name))
    video_data_id = c.lastrowid  # Get the id of the just inserted row

    # Insert frames and bounding boxes
    for frame_number, boxes in json_data['boxes'].items():
        c.execute("INSERT INTO frames (video_data_id, frame_number) VALUES (?, ?)", (video_data_id, frame_number))
        frame_id = c.lastrowid  # Get the id of the just inserted frame

        for box in boxes:
            c.execute('''
                INSERT INTO bounding_boxes 
                (frame_id, class, displayOrder, height, interpolate, interpolationID, interpolationNumber, width, x, y, visible)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (frame_id, box['class'], box['displayOrder'], box['height'], box['interpolate'], box['interpolationID'], box['interpolationNumber'], box['width'], box['x'], box['y'], box['visible']))

    conn.commit()
    conn.close()

# Test with a sample bounding box data file
json_file_path = 'backend/data/frames/buoy_left/boxes.json'
insert_bounding_box_data_from_file(json_file_path)
