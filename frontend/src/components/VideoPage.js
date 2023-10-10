import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BoundingBox from "./BoundingBox";
import LabelMenu from "./LabelMenu";
import Snackbar from "@mui/material/Snackbar";
import SaveIcon from "@mui/icons-material/Save";
import RepeatIcon from "@mui/icons-material/Repeat";
import LabelIcon from "@mui/icons-material/Label";
import Slider from "@mui/material/Slider";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LineStyleIcon from "@mui/icons-material/LineStyle";
import DeleteIcon from "@mui/icons-material/Delete";
import { updateInterpolationNumbers } from "./utils";
import Slide from "@mui/material/Slide";
import Alert from "@mui/material/Alert";

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

const BASE_URL = process.env.REACT_APP_BASE_URL;
const MAX_VIDEO_WIDTH = 840; // Example values; adjust as required
const MAX_VIDEO_HEIGHT = 800;

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
  const [showLabels, setShowLabels] = useState(true);
  const [runInterpolation, setRunInterpolation] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // can be 'error', 'info', 'warning', 'success'

  const scaleX = Math.min(MAX_VIDEO_WIDTH / data.video_width, 1);
  const scaleY = Math.min(MAX_VIDEO_HEIGHT / data.video_height, 1);
  const scale = Math.min(scaleX, scaleY);

  const scaleBoxesForSave = (boxes, scale) => {
    const scaledBoxes = { ...boxes };
    for (let frame in scaledBoxes) {
      scaledBoxes[frame] = scaledBoxes[frame].map((box) => ({
        ...box,
        x: box.x / scale, // Divide by scale
        y: box.y / scale,
        width: box.width / scale,
        height: box.height / scale,
      }));
    }
    return scaledBoxes;
  };

  const scaleBoxesOnLoad = (boxes, scale) => {
    console.log("scaleX:", scaleX, "scaleY:", scaleY, "scale:", scale);

    const scaledBoxes = { ...boxes };
    for (let frame in scaledBoxes) {
      scaledBoxes[frame] = scaledBoxes[frame].map((box) => ({
        ...box,
        x: box.x * scale, // Multiply by scale
        y: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
      }));
    }
    return scaledBoxes;
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

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
      const videoResponse = await axios.get(`${BASE_URL}/video/${videoName}`);
      setData(videoResponse.data);

      // Calculate scale values after fetching video data
      const localScaleX = Math.min(
        MAX_VIDEO_WIDTH / videoResponse.data.video_width,
        1
      );
      const localScaleY = Math.min(
        MAX_VIDEO_HEIGHT / videoResponse.data.video_height,
        1
      );
      const localScale = Math.min(localScaleX, localScaleY);

      // Fetching and scaling boxes
      try {
        const boxesResponse = await axios.get(
          `${BASE_URL}/data/frames/${videoName}/boxes.json`
        );
        let boxesData = boxesResponse.data.boxes || {};
        console.log("Loading unscaled", boxesData);
        boxesData = scaleBoxesOnLoad(boxesData, localScale); // Use local scale here
        console.log("Loading scaled", boxesData);
        setFrameBoxes(boxesData);
      } catch (error) {
        console.error("Failed to fetch boxes data:", error);
      }
    } catch (error) {
      console.error("Failed to fetch video data:", error);
    }
  };

  const fetchData = async () => {
    await fetchVideoData();
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

  const handleDeleteAllBoxes = () => {
    if (window.confirm("Are you sure you want to delete all boxes?")) {
      setFrameBoxes({});
      showSnackbar("All boxes deleted successfully!"); // Updated line
    }
  };

  const handleDeleteClick = (boxIndex) => {
    const updatedBoxesForFrame = [...(frameBoxes[currentFrame] || [])];

    if (boxIndex !== undefined) {
      updatedBoxesForFrame.splice(boxIndex, 1);

      updateInterpolationNumbers(updatedBoxesForFrame);

      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
    } else if (deleteRef.current) {
      deleteRef.current();
    }
  };

  const onChangeDisplayOrder = (draggedIndex, droppedIndex) => {
    const boxesForCurrentFrame = [...frameBoxes[currentFrame]];

    const [draggedItem] = boxesForCurrentFrame.splice(draggedIndex, 1); // Remove the dragged item from its position

    if (draggedIndex < droppedIndex) {
      droppedIndex -= 1; // Adjust the drop index because the original spot is still open
    }

    boxesForCurrentFrame.splice(droppedIndex, 0, draggedItem); // Insert it at the adjusted drop position

    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: boxesForCurrentFrame,
    }));
  };

  const saveBoxes = async () => {
    const boxesToSave = scaleBoxesForSave(frameBoxes, scale);

    const payload = {
      video_name: videoName,
      boxes: boxesToSave,
    };
    try {
      await axios.post(`${BASE_URL}/save-boxes`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Saving", payload.boxes);
      showSnackbar("Boxes saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save boxes:", error);
      showSnackbar("Failed to save boxes. Please try again.", "error");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleInterpolationClick = () => {
    setRunInterpolation(true);
  };

  const onInterpolationCompleted = () => {
    setRunInterpolation(false);
  };

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

  const toggleInterpolation = (frame, index) => {
    const updatedBoxesForFrame = [...(frameBoxes[frame] || [])];
    if (updatedBoxesForFrame[index]) {
      updatedBoxesForFrame[index].interpolate =
        !updatedBoxesForFrame[index].interpolate;
      updateInterpolationNumbers(updatedBoxesForFrame);

      setFrameBoxes((prev) => ({
        ...prev,
        [frame]: updatedBoxesForFrame,
      }));
    }
  };

  function getSliderMarks(frameBoxes, totalFrames, maxMarks = 10000) {
    const spacing = Math.ceil(totalFrames / maxMarks);
    let reducedFrames = [];

    for (let i = 0; i < totalFrames; i += spacing) {
      if (frameBoxes[i] && frameBoxes[i].length > 0) {
        const hasInterpolation = frameBoxes[i].some((box) => box.interpolate);
        reducedFrames.push({
          frame: i,
          interpolate: hasInterpolation,
        });
      }
    }

    return reducedFrames.map(({ frame, interpolate }) => ({
      value: parseInt(frame, 10),
      interpolate,
    }));
  }

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
                  onClick={() =>
                    updateFrame(Math.max(0, currentFrame - 5), carryBoxes)
                  }
                >
                  <div className="double-chevron">
                    <ChevronLeftIcon fontSize="large" />
                    <ChevronLeftIcon
                      fontSize="small"
                      className="inner-chevron"
                    />
                  </div>
                </button>

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

                <button
                  className="frame-button"
                  onClick={() =>
                    updateFrame(
                      Math.min(data.total_frames - 1, currentFrame + 5),
                      carryBoxes
                    )
                  }
                >
                  <div className="double-chevron">
                    <ChevronRightIcon fontSize="large" />
                    <ChevronRightIcon
                      fontSize="small"
                      className="inner-chevron"
                    />
                  </div>
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
                  marks={getSliderMarks(frameBoxes, data.total_frames)} // directly pass the result of getSliderMarks
                  sx={{
                    "& .MuiSlider-mark": {
                      height: 0.1,
                    },
                  }}
                />
                <div className="interpolation-indicators">
                  {getSliderMarks(frameBoxes, data.total_frames).map(
                    ({ value, interpolate }) =>
                      interpolate ? (
                        <div
                          key={value}
                          className="interpolation-indicator"
                          style={{
                            left: `${(value / (data.total_frames - 1)) * 100}%`,
                          }}
                          onClick={() => updateFrame(value, false)}
                        />
                      ) : null
                  )}
                </div>
              </div>
            </div>
            <div className="header-sidebar right-header-sidebar"></div>
          </header>
          <div id="frame-viewer">
            <div className="sidebar left-sidebar">
              <button
                className="icon-button"
                onClick={() => setShowLabels(!showLabels)}
                title="Toggle Labels"
              >
                <LabelIcon
                  style={{
                    color: showLabels ? "var(--highlight-text)" : "gray",
                  }}
                />
              </button>

              <button
                className="icon-button"
                onClick={() => setCarryBoxes((prev) => !prev)}
                title="Carry over boxes to next empty frame"
              >
                <RepeatIcon
                  style={{
                    color: carryBoxes ? "var(--highlight-text)" : "gray",
                  }}
                />
              </button>
              <button
                className="icon-button"
                onClick={handleInterpolationClick}
                title="Interpolate"
              >
                <LineStyleIcon />
              </button>
              <button
                className="icon-button"
                onClick={saveBoxes}
                title="Save Boxes"
              >
                <SaveIcon />
              </button>
              <button
                className="icon-button"
                onClick={handleDeleteAllBoxes}
                title="Delete All Boxes"
              >
                <DeleteIcon />
              </button>
            </div>

            <div className="main-content">
              <h2>Viewing frames for video: {data.video_name}</h2>
              <div
                className="frame-container"
                style={{
                  position: "relative",
                  width: `${data.video_width * scale}px`,
                  height: `${data.video_height * scale}px`,
                  overflow: "hidden",
                }}
              >
                <img
                  id="current-frame"
                  className="videoFrame"
                  src={`${BASE_URL}/data/frames/${data.video_name}/frame${currentFrame}.jpg`}
                  alt="Current frame"
                  style={{
                    width: `${data.video_width * scale}px`, // Adjusted width
                    height: `${data.video_height * scale}px`, // Adjusted height
                  }}
                />
                <BoundingBox
                  videoWidth={data.video_width * scale}
                  videoHeight={data.video_height * scale}
                  currentFrame={currentFrame}
                  frameBoxes={frameBoxes}
                  setFrameBoxes={setFrameBoxes}
                  onDeleteRef={deleteRef}
                  carryBoxes={carryBoxes}
                  boxClasses={classBoxes}
                  showLabels={showLabels}
                  runInterpolation={runInterpolation}
                  onInterpolationCompleted={onInterpolationCompleted}
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

                  updateInterpolationNumbers(updatedBoxesForFrame);

                  setFrameBoxes((prev) => ({
                    ...prev,
                    [currentFrame]: updatedBoxesForFrame,
                  }));
                }}
                onDelete={handleDeleteClick}
                boxClasses={classBoxes}
                setBoxClasses={setClassBoxes}
                onToggleInterpolation={toggleInterpolation}
                onChangeDisplayOrder={onChangeDisplayOrder}
              />
            </div>
          </div>
        </>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        TransitionComponent={TransitionRight}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default VideoPage;
