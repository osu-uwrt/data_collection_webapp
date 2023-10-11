import sqlite3
import os

def create_tables():
    db_dir = os.path.join(os.getcwd(), "backend/data/db")
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db_path = os.path.join(db_dir, 'data.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''CREATE TABLE video_data (
                id INTEGER PRIMARY KEY,
                video_id INTEGER NOT NULL,
                video_name TEXT NOT NULL UNIQUE,
                FOREIGN KEY(video_id) REFERENCES video(id))''')

    c.execute('''CREATE TABLE frames (
                id INTEGER PRIMARY KEY,
                video_data_id INTEGER NOT NULL,
                frame_number INTEGER NOT NULL,
                FOREIGN KEY(video_data_id) REFERENCES video_data(id))''')

    c.execute('''CREATE TABLE bounding_boxes (
                id INTEGER PRIMARY KEY,
                frame_id INTEGER NOT NULL,
                class TEXT NOT NULL,
                displayOrder INTEGER,
                height REAL NOT NULL,
                interpolate BOOLEAN,
                interpolationID TEXT,
                interpolationNumber TEXT,
                width INTEGER NOT NULL,
                x REAL NOT NULL,
                y REAL NOT NULL,
                visible BOOLEAN,
                FOREIGN KEY(frame_id) REFERENCES frames(id))''')
    
    c.execute('''CREATE TABLE video (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL UNIQUE,
                file_path TEXT,
                team_id INTEGER,
                is_published_to_main INTEGER DEFAULT 0)''')  # Add other fields as necessary


    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
