import json
import os
import cv2
import tkinter as tk
import shutil
import random
from tkinter import filedialog, messagebox

# Load JSON file and enable convert button
def load_file():
    global json_file_path
    json_file_path = filedialog.askopenfilename(title="Select JSON file", filetypes=[("JSON Files", "*.json")])
    if json_file_path:
        messagebox.showinfo("Info", "JSON loaded successfully")
        convert_button.config(state="normal")

# Load JSON file and enable convert button
def extract_frames(video_path, output_path):
    cap = cv2.VideoCapture(video_path)
    frame_num = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_name = os.path.join(output_path, f"{frame_num}.jpg")
        cv2.imwrite(frame_name, frame)
        frame_num += 1
    cap.release()

# Generate a YAML file with dataset details
def create_yaml(video_name, output_dir, class_names):
    yaml_content = {
        'train': f'{output_dir}/dataset/images/train/{video_name}/',
        'val': f'{output_dir}/dataset/images/val/{video_name}/',
        'nc': len(class_names),
        'names': class_names
    }

    with open(f'{output_dir}/dataset/{video_name}.yaml', 'w') as yaml_file:
        json.dump(yaml_content, yaml_file, indent=2)

# Convert JSON annotations to YOLOv5 format and organize data
def convert():
    if not json_file_path:
        messagebox.showwarning("Warning", "No JSON file selected")
        return

    with open(json_file_path, 'r') as f:
        data = json.load(f)

    video_name = os.path.splitext(os.path.basename(data['video_path']))[0]
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    video_file_path = data['video_path']
    if not os.path.exists(video_file_path):
        messagebox.showwarning("Warning", "Video file not found")
        video_file_path = filedialog.askopenfilename(title="Select Video file", filetypes=[("Video Files", "*.*")])
        if not video_file_path:
            messagebox.showwarning("Warning", "Video file is required")
            return

    paths_to_check = [
        os.path.join(output_dir, 'dataset', 'images', 'train', video_name),
        os.path.join(output_dir, 'dataset', 'images', 'val', video_name),
        os.path.join(output_dir, 'dataset', 'labels', 'train', video_name),
        os.path.join(output_dir, 'dataset', 'labels', 'val', video_name),
    ]
    
    if any(os.path.exists(path) for path in paths_to_check):
        response = messagebox.askyesno("Confirmation", f"Some directories for the video {video_name} already exist. Do you want to overwrite?")
        if response:
            for path in paths_to_check:
                if os.path.exists(path):
                    shutil.rmtree(path)
        else:
            return 

    frames_output_path = os.path.join(output_dir, 'dataset', 'images', 'train', video_name)
    os.makedirs(frames_output_path, exist_ok=True)
    extract_frames(video_file_path, frames_output_path)

    label_output_path = os.path.join(output_dir, 'dataset', 'labels', 'train', video_name)
    os.makedirs(label_output_path, exist_ok=True)

    max_frame = max(map(int, data['frame_bbox_states'].keys()))

    frame_indices = list(range(max_frame + 1))
    random.shuffle(frame_indices)
    split_ratio = val_split_scale.get() / 100
    val_indices = set(random.sample(frame_indices, int((max_frame + 1) * split_ratio)))

    class_names = set()

    for frame in frame_indices:
        annotations = data['frame_bbox_states'].get(str(frame), [])
        
        subset = 'val' if frame in val_indices else 'train'

        label_dir_path = os.path.join(output_dir, 'dataset', 'labels', subset, video_name)
        os.makedirs(label_dir_path, exist_ok=True)

        label_file_path = os.path.join(label_dir_path, f'{frame}.txt')
        with open(label_file_path, 'w') as f:
            pass

        for annotation in annotations:

            class_id = annotation['class_id']
            class_names.add(class_id)
            x_center = annotation['x_center']
            y_center = annotation['y_center']
            width = annotation['width']
            height = annotation['height']

            with open(label_file_path, 'a') as f: 
                f.write(f'{int(class_id)} {x_center} {y_center} {width} {height}\n')
        
        if frame in val_indices:
            val_output_path = os.path.join(output_dir, 'dataset', 'images', 'val', video_name)
            os.makedirs(val_output_path, exist_ok=True)
            shutil.move(os.path.join(frames_output_path, f'{frame}.jpg'), os.path.join(val_output_path, f'{frame}.jpg'))

    class_names = list(class_names)
    class_names.sort()

    create_yaml(video_name, output_dir, class_names)

    messagebox.showinfo("Success", "The file was converted successfully.")

# Update validation split variable on scale change
def on_scale_change(val):
    val_split_var.set(val)

# Adjust scale based on entry widget input
def on_entry_change(*args):
    val = val_split_var.get()
    if 0 <= val <= 100:
        val_split_scale.set(val)
    else:
        val_split_var.set(val_split_scale.get())

def main():
    global root, convert_button, val_split_scale, val_split_var

    root = tk.Tk()
    root.title("JSON to YOLOv5 Converter")

    load_button = tk.Button(root, text="Load JSON File", command=load_file)
    load_button.pack(pady=10)

    val_split_var = tk.IntVar(value=20)

    tk.Label(root, text="Validation Split (%)").pack(pady=2, padx=20)
    val_split_scale = tk.Scale(root, from_=0, to=100, orient=tk.HORIZONTAL, length=250, variable=val_split_var, command=on_scale_change)
    val_split_scale.pack(pady=10)

    val_split_entry = tk.Entry(root, textvariable=val_split_var, width=5)
    val_split_entry.pack(pady=10)

    convert_button = tk.Button(root, text="Convert", command=convert, state="disabled")
    convert_button.pack(pady=10)

    val_split_var.trace_add('write', on_entry_change)

    root.mainloop()

if __name__ == "__main__":
    main()