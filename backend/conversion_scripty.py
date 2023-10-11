import json
import os

# Sample mapping of class names to class IDs
class_id_mapping = {"class1":0}

def convert_to_output(input_data):
    output_data = {
        "video_name": input_data["video_name"],
        "frame_bbox_states": {}
    }

    VIDEO_WIDTH = input_data["video_width"]
    VIDEO_HEIGHT = input_data["video_height"]

    for frame, boxes in input_data["boxes"].items():
        frame_data = []
        for box in boxes:
            x_center = (box["x"] + box["width"] / 2) / VIDEO_WIDTH
            y_center = (box["y"] + box["height"] / 2) / VIDEO_HEIGHT
            width = box["width"] / VIDEO_WIDTH
            height = box["height"] / VIDEO_HEIGHT
            class_id = class_id_mapping.get(box["class"], -1)

            frame_data.append({
                "x_center": x_center,
                "y_center": y_center,
                "width": width,
                "height": height,
                "class_id": class_id
            })
        output_data["frame_bbox_states"][frame] = frame_data

    return output_data

def process_directory(directory_path):
    input_filepath = os.path.join(directory_path, "boxes.json")
    if not os.path.exists(input_filepath):
        return  # Skip if boxes.json doesn't exist

    with open(input_filepath, 'r') as infile:
        data = json.load(infile)

    output_data = convert_to_output(data)

    output_filepath = os.path.join(directory_path, f"{os.path.basename(directory_path)}.json")
    with open(output_filepath, 'w') as outfile:
        json.dump(output_data, outfile, indent=4)

def main():
    base_path = "backend/data/frames/"
    for directory_name in os.listdir(base_path):
        directory_path = os.path.join(base_path, directory_name)
        if os.path.isdir(directory_path):
            process_directory(directory_path)

if __name__ == '__main__':
    main()
