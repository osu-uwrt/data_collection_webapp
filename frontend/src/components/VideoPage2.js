import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BoundingBox from "./BoundingBox";
import LabelMenu from "./LabelMenu";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import Switch from "@material-ui/core/Switch";
import Slider from "@material-ui/core/Slider";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { makeStyles } from "@material-ui/core/styles";

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
        `http://192.168.1.3:5000/video/${videoName}`
      );
      setData(videoResponse.data);
    } catch (error) {
      console.error("Failed to fetch video data:", error);
    }
  };

  const fetchBoxesData = async () => {
    try {
      const boxesResponse = await axios.get(
        `http://192.168.1.3:5000/data/frames/${videoName}/boxes.json`
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
        "http://192.168.1.3:5000/save-boxes",
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
    <div>
      <header className="app-header">
        <div className="slider-container">
          <div id="frame-slider">
            <Slider
              size="small"
              defaultValue={currentFrame}
              aria-label="Small"
              valueLabelDisplay="auto"
              min={0}
              max={data.total_frames - 1}
              value={currentFrame}
              onChange={(e, newValue) => updateFrame(newValue, false)}
            />
          </div>
          <div className="frame-count-controls">
            <button onClick={() => updateFrame(currentFrame - 1, carryBoxes)}>
              <ChevronLeftIcon
                onClick={() => updateFrame(currentFrame - 1, carryBoxes)}
              />
            </button>
            <h3>
              {currentFrame} / {data.total_frames - 1}
            </h3>
            <button onClick={() => updateFrame(currentFrame + 1, carryBoxes)}>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </header>
      <div id="frame-viewer">
        <div className="sidebar left-sidebar">
          <button
            className="icon-button"
            onClick={handleDeleteClick}
            title="Delete Selected Box"
          >
            <CloseIcon />
          </button>
          <button
            className="icon-button"
            onClick={saveBoxes}
            title="Save Boxes"
          >
            <SaveIcon />
          </button>
          <div className="carry-boxes-control">
            <Switch
              checked={carryBoxes}
              onChange={handleCarryBoxesChange}
              name="carryBoxes"
              inputProps={{ "aria-label": "Carry over boxes toggle" }}
            />
            <label htmlFor="carryBoxes" title="Carry over boxes"></label>
          </div>
        </div>

        <div className="main-content">
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
                  src={`http://192.168.1.3:5000/data/frames/${data.video_name}/frame${currentFrame}.jpg`}
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
            </>
          )}
        </div>

        <div className="sidebar right-sidebar">
          {/* Place your right sidebar content here */}
        </div>
      </div>
    </div>
  );
}

export default VideoPage;
