from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_cors import CORS
from flask_wtf import FlaskForm, CSRFProtect
from wtforms import FloatField, FileField, validators
from app_instance import app
import modules.add_video
import pages.video
import modules.video_serving
import modules.bbox_processing
import modules.register
import modules.login
import modules.teams
from modules.video_processing import get_published_videos

# Move the app configurations to the top
app.secret_key = 'some_secret_key'  # Change this to a secure key
#csrf = CSRFProtect(app)
CORS(app, resources={r"/*": {"origins": "*"}})



@app.route('/')
def index():
    videos = get_published_videos()
    return jsonify(videos)

for rule in app.url_map.iter_rules():
    print(rule)

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
