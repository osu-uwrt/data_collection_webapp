import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

function VideoPage() {
  const { videoName } = useParams();
  const [data, setData] = useState({
    video_name: "",
    total_frames: 0,
    video_height: 0,
    video_width: 0,
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [boundingBoxes, setBoundingBoxes] = useState({});
  const [isDraggable, setIsDraggable] = useState(true);
  const [lastBoxSize, setLastBoxSize] = useState({ width: 100, height: 100 });

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(
        `http://localhost:5000/video/${videoName}`
      );
      setData(response.data);
      setBoundingBoxes({});
    }
    fetchData();
  }, [videoName]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowLeft") {
        updateFrame(currentFrame - 1);
      } else if (event.key === "ArrowRight") {
        updateFrame(currentFrame + 1);
      }
    },
    [currentFrame]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const updateFrame = (frameNumber) => {
    if (frameNumber >= 0 && frameNumber < data.total_frames) {
      setCurrentFrame(frameNumber);
    }
  };

  const addBoundingBox = (event) => {
    if (event.ctrlKey) {
      const boundingRect = event.target.getBoundingClientRect();
      const xPosition = event.clientX - boundingRect.left;
      const yPosition = event.clientY - boundingRect.top;
      const newBox = {
        top: yPosition - lastBoxSize.height / 2,
        left: xPosition - lastBoxSize.width / 2,
        width: lastBoxSize.width,
        height: lastBoxSize.height,
      };
      setBoundingBoxes((prevBoxes) => ({
        ...prevBoxes,
        [currentFrame]: [...(prevBoxes[currentFrame] || []), newBox],
      }));
    }
  };

  const currentFrameBoxes = boundingBoxes[currentFrame] || [];

  return (
    <div id="frame-viewer" onClick={addBoundingBox}>
      <h2>Viewing frames for video: {data.video_name}</h2>

      <div
        className="frame-container"
        style={{
          position: "relative",
          width: `${data.video_width}px`,
          height: `${data.video_height}px`,
          overflow: "hidden",
        }}
      >
        <img
          id="current-frame"
          className="videoFrame"
          src={`http://localhost:5000/data/frames/${data.video_name}/frame${currentFrame}.jpg`}
          alt="Current frame"
        />

        {currentFrameBoxes.map((box, index) => (
          <Draggable
            key={`draggable-${index}`}
            bounds="parent"
            position={{ x: box.left, y: box.top }}
            disabled={!isDraggable}
            onStop={(e, data) => {
              setLastBoxSize({ width: box.width, height: box.height });
              setBoundingBoxes((prevBoxes) => {
                const updatedBoxes = { ...prevBoxes };
                if (updatedBoxes[currentFrame]) {
                  updatedBoxes[currentFrame][index].left = data.x;
                  updatedBoxes[currentFrame][index].top = data.y;
                }
                return updatedBoxes;
              });
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0 }}>
              <ResizableBox
                width={box.width}
                height={box.height}
                minConstraints={[10, 10]}
                maxConstraints={[
                  data.video_width - box.left,
                  data.video_height - box.top,
                ]}
                onResizeStart={(e) => {
                  e.stopPropagation();
                  setIsDraggable(false);
                }}
                onResizeStop={(e, data) => {
                  setLastBoxSize(data.size);
                  e.stopPropagation();
                  setTimeout(() => {
                    setIsDraggable(true);
                  }, 100);
                  setBoundingBoxes((prevBoxes) => {
                    const updatedBoxes = { ...prevBoxes };
                    if (updatedBoxes[currentFrame]) {
                      updatedBoxes[currentFrame][index].width = data.size.width;
                      updatedBoxes[currentFrame][index].height =
                        data.size.height;
                    }
                    return updatedBoxes;
                  });
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "2px solid red",
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

      <h3>
        Current frame: {currentFrame} / {data.total_frames - 1}
      </h3>
    </div>
  );
}

export default VideoPage;
