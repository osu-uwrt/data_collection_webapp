from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_cors import CORS
from flask_wtf import FlaskForm, CSRFProtect
from wtforms import FloatField, FileField, validators
from app_instance import app
import pages.page1
import pages.video
import modules.video_serving
import modules.bbox_processing
from modules.video_processing import get_uploaded_videos

# Move the app configurations to the top
app.secret_key = 'some_secret_key'  # Change this to a secure key
#csrf = CSRFProtect(app)
CORS(app, resources={r"/*": {"origins": "*"}})



@app.route('/')
def index():
    videos = get_uploaded_videos()
    return jsonify(videos)

for rule in app.url_map.iter_rules():
    print(rule)

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
