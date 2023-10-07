import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BoundingBox from "./BoundingBox";
import LabelMenu from "./LabelMenu";
import SaveIcon from "@mui/icons-material/Save";
import Switch from "@mui/material/Switch";
import Slider from "@mui/material/Slider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/* TODO 
FIX HEADER SIZE TO SAME SIZE AS VIDEO ON SMALL RESIZE
ADJUST PADDING BETWEEN SLIDER/BUTTONS
*/

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

  // Newly added state for class colors
  const [classBoxes, setClassBoxes] = useState({
    class1: { strokeColor: "cyan", fillColor: "rgba(0, 255, 255, 0.25)" },
    class2: { strokeColor: "limegreen", fillColor: "rgba(50, 205, 50, 0.25)" },
    class3: { strokeColor: "yellow", fillColor: "rgba(255, 255, 0, 0.25)" },
    class4: { strokeColor: "yellow", fillColor: "rgba(255, 255, 0, 0.25)" },
    // ... other classes
  });

  useEffect(() => {
    const savedColors = localStorage.getItem("classBoxes");
    if (savedColors) {
      setClassBoxes(JSON.parse(savedColors));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("classBoxes", JSON.stringify(classBoxes));
  }, [classBoxes]);

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

  const handleDeleteClick = (boxIndex) => {
    const updatedBoxesForFrame = [...(frameBoxes[currentFrame] || [])];

    if (boxIndex !== undefined) {
      updatedBoxesForFrame.splice(boxIndex, 1);
      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
    } else if (deleteRef.current) {
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
        payload,
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
    <div className="video-page">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <header className="app-header">
            <div className="header-sidebar left-header-sidebar"></div>
            <div className="slider-container">
              <div className="frame-count-controls">
                <button
                  className="frame-button"
                  onClick={() => updateFrame(currentFrame - 1, carryBoxes)}
                >
                  <ChevronLeftIcon fontSize="large" />
                </button>
                <h3>
                  {currentFrame} / {data.total_frames - 1}
                </h3>
                <button
                  className="frame-button"
                  onClick={() => updateFrame(currentFrame + 1, carryBoxes)}
                >
                  <ChevronRightIcon fontSize="large" />
                </button>
              </div>
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
            </div>
            <div className="header-sidebar right-header-sidebar"></div>
          </header>
          <div id="frame-viewer">
            <div className="sidebar left-sidebar">
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
                  aria-label="Carry over boxes toggle"
                />
                <label htmlFor="carryBoxes" title="Carry over boxes"></label>
              </div>
            </div>

            <div className="main-content">
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
                  boxClasses={classBoxes}
                />
              </div>
            </div>

            <div className="sidebar right-sidebar">
              <LabelMenu
                key={currentFrame}
                boundingBoxes={frameBoxes}
                currentFrame={currentFrame}
                onClassChange={(index, newClass) => {
                  const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
                  updatedBoxesForFrame[index].class = newClass;

                  setFrameBoxes((prev) => ({
                    ...prev,
                    [currentFrame]: updatedBoxesForFrame,
                  }));
                }}
                onDelete={handleDeleteClick}
                boxClasses={classBoxes}
                setBoxClasses={setClassBoxes}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VideoPage;
