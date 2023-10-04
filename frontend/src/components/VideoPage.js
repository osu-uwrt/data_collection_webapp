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
  const [carryBoxes, setCarryBoxes] = useState(false);
  const [loading, setLoading] = useState(true);
  const deleteRef = useRef(null);

  const fetchVideoData = async () => {
    try {
      const videoResponse = await axios.get(
        `http://localhost:5000/video/${videoName}`
      );
      setData(videoResponse.data);
    } catch (error) {
      console.error("Failed to fetch video data:", error);
    }
  };

  const fetchBoxesData = async () => {
    try {
      const boxesResponse = await axios.get(
        `http://localhost:5000/data/frames/${videoName}/boxes.json`
      );
      setFrameBoxes(boxesResponse.data.boxes || {});
    } catch (error) {
      console.error("Failed to fetch boxes data:", error);
    }
  };

  const fetchData = async () => {
    await fetchVideoData();
    await fetchBoxesData();
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [videoName]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateFrame(currentFrame - 1, carryBoxes);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        updateFrame(currentFrame + 1, carryBoxes);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        handleDeleteClick();
      }
    },
    [currentFrame, data.total_frames, carryBoxes]
  );

  const handleCarryBoxesChange = (e) => {
    setCarryBoxes(e.target.checked);
  };

  const handleDeleteClick = () => {
    if (deleteRef.current) {
      deleteRef.current();
    }
  };

  const saveBoxes = async () => {
    const payload = {
      video_name: videoName,
      boxes: frameBoxes,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/save-boxes",
        payload, // send the payload object
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      alert("Boxes saved successfully!");
    } catch (error) {
      console.error("Failed to save boxes:", error);
      alert("Failed to save boxes. Please try again.");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const updateFrame = (newFrame, carryOver) => {
    if (newFrame >= 0 && newFrame < data.total_frames) {
      setCurrentFrame(newFrame);

      setFrameBoxes((prevFrameBoxes) => {
        if (
          carryOver &&
          (!prevFrameBoxes[newFrame] || prevFrameBoxes[newFrame].length === 0)
        ) {
          return {
            ...prevFrameBoxes,
            [newFrame]: [...(prevFrameBoxes[currentFrame] || [])],
          };
        }

        return prevFrameBoxes;
      });
    }
  };

  return (
    <div id="frame-viewer">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
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
              carryBoxes={carryBoxes}
            />
          </div>

          <div>
            <button onClick={() => updateFrame(currentFrame - 1, carryBoxes)}>
              Previous
            </button>
            <button onClick={() => updateFrame(currentFrame + 1, carryBoxes)}>
              Next
            </button>
            <button onClick={handleDeleteClick}>Delete Selected Box</button>
            <button onClick={saveBoxes}>Save Boxes</button>
            <label>
              <input
                type="checkbox"
                checked={carryBoxes}
                onChange={handleCarryBoxesChange}
              />
              Carry over boxes
            </label>
          </div>
          <div>
            <input
              type="range"
              id="frame-slider"
              min="0"
              max={data.total_frames - 1}
              value={currentFrame}
              onChange={(e) =>
                updateFrame(parseInt(e.target.value), carryBoxes)
              }
            />
          </div>
          <h3>
            Current frame: {currentFrame} / {data.total_frames - 1}
          </h3>
        </>
      )}
    </div>
  );
}

export default VideoPage;
