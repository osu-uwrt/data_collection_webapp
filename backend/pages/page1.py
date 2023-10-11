# page1.py
from flask import render_template, request, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import FloatField, FileField, validators
from werkzeug.utils import secure_filename

from modules.video_processing import save_and_extract_frames
# Import the app object from app_instance
from app_instance import app

# Form definition
class VideoForm(FlaskForm):
    video = FileField('Load Video', [validators.InputRequired()])

@app.route('/page1', methods=['GET', 'POST'])
def page1():
    form = VideoForm() 
    if request.method == 'POST' and form.validate():
        video_file = request.files['video']

        video_id = save_and_extract_frames(video_file)  # capture the returned video_id

        flash('Processing completed', 'success')
        return redirect(url_for('page2', video_id=video_id))  # use video_id instead of video_name
    return render_template('page1.html', form=form)
