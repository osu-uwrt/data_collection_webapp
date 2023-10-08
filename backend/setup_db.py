import sqlite3
import os

def create_tables():
    db_dir = os.path.join(os.getcwd(), "data/db")
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
    
    db_path = os.path.join(db_dir, 'data.db')
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''CREATE TABLE user (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    hashed_password TEXT NOT NULL)''')

    c.execute('''CREATE TABLE team (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL)''')

    c.execute('''CREATE TABLE userteam (
                    user_id INTEGER NOT NULL,
                    team_id INTEGER NOT NULL,
                    PRIMARY KEY(user_id, team_id),
                    FOREIGN KEY(user_id) REFERENCES user(id),
                    FOREIGN KEY(team_id) REFERENCES team(id))''')

    c.execute('''CREATE TABLE video_data (
                id INTEGER PRIMARY KEY,
                video_name TEXT NOT NULL UNIQUE,
                boxes_data TEXT NOT NULL)''')
    
    c.execute('''CREATE TABLE video (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    team_id INTEGER,
                    is_published_to_main INTEGER DEFAULT 0,
                    FOREIGN KEY(team_id) REFERENCES team(id))''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
