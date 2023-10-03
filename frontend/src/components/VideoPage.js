import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BoundingBox from "./BoundingBox";

function VideoPage() {
  const { videoName } = useParams();
  const [data, setData] = useState({
    video_name: "",
    total_frames: 0,
    video_height: 0,
    video_width: 0,
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameBoxes, setFrameBoxes] = useState({});
  const deleteRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(
        `http://localhost:5000/video/${videoName}`
      );
      setData(response.data);
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

  const handleDeleteClick = () => {
    if (deleteRef.current) {
      deleteRef.current();
    }
  };

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

  return (
    <div id="frame-viewer">
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
        <BoundingBox
          videoWidth={data.video_width}
          videoHeight={data.video_height}
          currentFrame={currentFrame}
          frameBoxes={frameBoxes}
          setFrameBoxes={setFrameBoxes}
          onDeleteRef={deleteRef}
        />
      </div>

      <div>
        <button onClick={() => updateFrame(currentFrame - 1)}>Previous</button>
        <button onClick={() => updateFrame(currentFrame + 1)}>Next</button>
        <button onClick={handleDeleteClick}>Delete Selected Box</button>
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
