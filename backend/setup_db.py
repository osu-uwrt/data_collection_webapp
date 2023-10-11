import sqlite3
import os

def create_tables():
    db_dir = os.path.join(os.getcwd(), "backend/data/db")
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db_path = os.path.join(db_dir, 'data.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Create Video table
    c.execute('''
        CREATE TABLE IF NOT EXISTS Video (
            video_id INTEGER PRIMARY KEY,
            video_name TEXT NOT NULL,
            video_width INTEGER NOT NULL,
            video_height INTEGER NOT NULL
        )
    ''')

    # Create BoundingBox table
    c.execute('''
        CREATE TABLE IF NOT EXISTS BoundingBox (
            box_id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id INTEGER,
            frame_number INTEGER NOT NULL,
            class TEXT NOT NULL,
            displayOrder INTEGER NOT NULL,
            height REAL NOT NULL,
            width REAL NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            interpolate BOOLEAN NOT NULL,
            interpolationID INTEGER,
            interpolationNumber INTEGER,
            visible BOOLEAN NOT NULL,
            FOREIGN KEY (video_id) REFERENCES Video(video_id)
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashed_password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            first_name TEXT,
            last_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )   
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
