import sqlite3
import os

def create_tables():
    db_dir = os.path.join(os.getcwd(), "backend/data/db")
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db_path = os.path.join(db_dir, 'data.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS Video (
            video_id INTEGER PRIMARY KEY,
            video_name TEXT NOT NULL,
            video_width INTEGER NOT NULL,
            video_height INTEGER NOT NULL,
            team_id INTEGER REFERENCES Team(team_id)
        )
    ''')

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
            last_login DATETIME,
            team_id INTEGER REFERENCES Team(team_id)
        )   
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS Classes (
            class_id INTEGER PRIMARY KEY,
            class_name TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS UserClassColors (
            user_class_color_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            class_id INTEGER,
            color TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(user_id),
            FOREIGN KEY (class_id) REFERENCES Classes(class_id),
            UNIQUE(user_id, class_id)
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS Team (
            team_id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
