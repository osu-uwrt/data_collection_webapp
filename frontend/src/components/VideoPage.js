import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';


function VideoPage() {
  const { videoName } = useParams();
  const [data, setData] = useState({
    video_name: '',
    total_frames: 0,
    video_height: 0,
    video_width: 0,
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isDraggable, setIsDraggable] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(`http://localhost:5000/video/${videoName}`);
      setData(response.data);
      // TODO: Fetch bounding boxes for the video and frame here, if they exist
    }
    fetchData();
  }, [videoName]);

  const updateFrame = (frameNumber) => {
    setCurrentFrame(frameNumber);
    // TODO: Fetch bounding boxes for the new frame here
  };

  const addBoundingBox = () => {
    setBoundingBoxes([...boundingBoxes, {
      top: 50, left: 50, width: 100, height: 100 // default position and size
    }]);
  };

  return (
    <div id="frame-viewer">
        <h2>Viewing frames for video: {data.video_name}</h2>
        
        <div 
        className="frame-container" 
        style={{ position: 'relative', width: `${data.video_width}px`, height: `${data.video_height}px`, overflow: 'hidden' }} 
      >
          <img 
              id="current-frame" 
              className="videoFrame"
              src={`http://localhost:5000/data/frames/${data.video_name}/frame${currentFrame}.jpg`} 
              alt="Current frame"
          />

{boundingBoxes.map((box, index) => (
    <Draggable
        key={`draggable-${index}`}
        bounds="parent"
        position={{ x: box.left, y: box.top }}
        disabled={!isDraggable}
        onStop={(e, data) => {
            const updatedBoxes = [...boundingBoxes];
            updatedBoxes[index].left = data.x;
            updatedBoxes[index].top = data.y;
            setBoundingBoxes(prevBoxes => {
              const updatedBoxes = [...prevBoxes];
              updatedBoxes[index].left = data.x;
              updatedBoxes[index].top = data.y;
              return updatedBoxes;
          });
        }}
    >
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <ResizableBox
                width={box.width}
                height={box.height}
                minConstraints={[10, 10]}
                maxConstraints={[data.video_width - box.left, data.video_height - box.top]}
                onResizeStart={(e) => {
                    e.stopPropagation();
                    setIsDraggable(false);
                }}
                onResizeStop={(e, data) => {
                  e.stopPropagation();
                  setTimeout(() => {
                      setIsDraggable(true);
                  }, 100);
                  const updatedBoxes = [...boundingBoxes];
                  updatedBoxes[index].width = data.size.width;
                  updatedBoxes[index].height = data.size.height;
                  setBoundingBoxes(prevBoxes => {
                    const updatedBoxes = [...prevBoxes];
                    updatedBoxes[index].width = data.size.width;
                    updatedBoxes[index].height = data.size.height;
                    return updatedBoxes;
                });
                
              }}
            >
                <div 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: '2px solid red'
                    }}
                />
            </ResizableBox>
        </div>
    </Draggable>
))}

      </div>

        <div>
            <button onClick={() => updateFrame(currentFrame - 1)}>Previous</button>
            <button onClick={() => updateFrame(currentFrame + 1)}>Next</button>
            <button onClick={addBoundingBox}>Add Bounding Box</button>
        </div>

        <div>
            <input 
                type="range" 
                id="frame-slider" 
                min="0" 
                max={data.total_frames - 1} 
                value={currentFrame} 
                onChange={(e) => updateFrame(parseInt(e.target.value))}
            />
        </div>

        <h3>Current frame: {currentFrame} / {data.total_frames - 1}</h3>
        <h3>Draggable: {isDraggable.toString()}</h3>

    </div>
);


}

export default VideoPage;
