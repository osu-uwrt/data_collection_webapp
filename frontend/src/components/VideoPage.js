import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import logo from "../logo.svg";
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
import VisibilityIcon from "@mui/icons-material/Visibility";

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

const BASE_URL = process.env.REACT_APP_BASE_URL;
const MAX_VIDEO_WIDTH = 1440; // Example values; adjust as required
const MAX_VIDEO_HEIGHT = 800;

/* TODO 
FIX HEADER SIZE TO SAME SIZE AS VIDEO ON SMALL RESIZE
ADJUST PADDING BETWEEN SLIDER/BUTTONS
*/

function VideoPage() {
  const { videoId } = useParams();
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
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [allBoxesVisible, setAllBoxesVisible] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    console.log("Selected value in Parent:", selected);
  }, [selected]);

  const scaleX = Math.min(MAX_VIDEO_WIDTH / data.video_width, 1);
  const scaleY = Math.min(MAX_VIDEO_HEIGHT / data.video_height, 1);
  const scale = Math.min(scaleX, scaleY);

  const toggleBoxVisibility = (index) => {
    const updatedBoxesForFrame = [...frameBoxes[currentFrame]];

    // Toggle visibility at the specified index
    if (updatedBoxesForFrame[index]) {
      updatedBoxesForFrame[index].visible =
        !updatedBoxesForFrame[index].visible;
    }

    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: updatedBoxesForFrame,
    }));
  };

  const toggleAllBoxVisibility = () => {
    setAllBoxesVisible(!allBoxesVisible);
    // Deep copy the frameBoxes object to ensure React detects changes
    const updatedFrameBoxes = JSON.parse(JSON.stringify(frameBoxes));

    // Toggle visibility for every box of every frame
    for (let frame in updatedFrameBoxes) {
      for (let i = 0; i < updatedFrameBoxes[frame].length; i++) {
        updatedFrameBoxes[frame][i].visible = !allBoxesVisible;
      }
    }

    setFrameBoxes(updatedFrameBoxes);
  };

  const normalizeBoxesForSave = (boxes, videoWidth, videoHeight, scale) => {
    const normalizedBoxes = { ...boxes };
    for (let frame in normalizedBoxes) {
      normalizedBoxes[frame] = normalizedBoxes[frame].map((box) => ({
        ...box,
        x: (box.x + box.width / 2) / scale / videoWidth,
        y: (box.y + box.height / 2) / scale / videoHeight,
        width: box.width / scale / videoWidth,
        height: box.height / scale / videoHeight,
      }));
    }
    return normalizedBoxes;
  };

  const scaleNormalizedBoxesOnLoad = (
    boxes,
    videoWidth,
    videoHeight,
    scale
  ) => {
    const scaledBoxes = { ...boxes };
    for (let frame in scaledBoxes) {
      scaledBoxes[frame] = scaledBoxes[frame].map((box) => ({
        ...box,
        x: box.x * videoWidth * scale - (box.width * videoWidth * scale) / 2,
        y: box.y * videoHeight * scale - (box.height * videoHeight * scale) / 2,
        width: box.width * videoWidth * scale,
        height: box.height * videoHeight * scale,
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
    console.log("Updated Frame Boxes", frameBoxes);
  }, [frameBoxes]);

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
      const videoResponse = await axios.get(`${BASE_URL}/video/${videoId}`);
      setData(videoResponse.data);
      console.log(videoResponse.data);

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
          `${BASE_URL}/data/frames/${videoId}/boxes.json`
        );
        let boxesData = boxesResponse.data.boxes || {};
        boxesData = scaleNormalizedBoxesOnLoad(
          boxesData,
          videoResponse.data.video_width,
          videoResponse.data.video_height,
          localScale
        );

        for (let i = 0; i < videoResponse.data.total_frames; i++) {
          if (boxesData[i] === undefined) {
            setFrameBoxes((prev) => ({
              ...prev,
              [i]: [],
            }));
          }
        }
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
  }, [videoId]);

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
    [currentFrame, data.total_frames, carryBoxes, selected]
  );

  const handleDeleteAllBoxes = () => {
    if (window.confirm("Are you sure you want to delete all boxes?")) {
      setFrameBoxes({});
      showSnackbar("All boxes deleted successfully!"); // Updated line
    }
  };

  const handleDeleteClick = () => {
    console.log("selected", selected);
    if (selected === null) return;

    deleteBoxAtIndex(selected);
  };

  const deleteBoxAtIndex = (index) => {
    ReactDOM.unstable_batchedUpdates(() => {
      const updatedBoxesForFrame = [...(frameBoxes[currentFrame] || [])];
      updatedBoxesForFrame.splice(index, 1);
      updateInterpolationNumbers(updatedBoxesForFrame);

      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
    });

    showSnackbar("Box deleted successfully!");
  };

  const onChangeDisplayOrder = (draggedOrder, droppedOrder) => {
    const boxesForCurrentFrame = [...frameBoxes[currentFrame]];

    // Convert the displayOrder to array indices
    const draggedIndex = boxesForCurrentFrame.findIndex(
      (box) => box.displayOrder === draggedOrder
    );
    const droppedIndex = boxesForCurrentFrame.findIndex(
      (box) => box.displayOrder === droppedOrder
    );

    const [draggedItem] = boxesForCurrentFrame.splice(draggedIndex, 1);

    // Adjust the drop index based on whether the box is moved up or down
    let insertIndex;
    if (droppedIndex === -1) {
      insertIndex = boxesForCurrentFrame.length;
    } else {
      insertIndex = droppedIndex;
      if (draggedIndex < droppedIndex) {
        insertIndex -= 1;
      }
    }

    boxesForCurrentFrame.splice(insertIndex, 0, draggedItem);

    // Re-assign displayOrder values based on their new positions in the array
    boxesForCurrentFrame.forEach((box, index) => {
      box.displayOrder = index;
    });

    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: boxesForCurrentFrame,
    }));
  };

  const saveBoxes = async () => {
    const boxesToSave = normalizeBoxesForSave(
      frameBoxes,
      data.video_width,
      data.video_height,
      scale
    );

    const payload = {
      video_id: videoId,
      video_width: data.video_width,
      video_height: data.video_height,
      boxes: boxesToSave,
    };

    console.log(payload);
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
          // Carry over the boxes, and set interpolate to false
          const carriedOverBoxes = (prevFrameBoxes[currentFrame] || []).map(
            (box) => ({
              ...box,
              interpolate: false, // Ensure interpolate is set to false
            })
          );

          return {
            ...prevFrameBoxes,
            [newFrame]: carriedOverBoxes,
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
        <div />
      ) : (
        <>
          <header className="app-header">
            <div className="header-sidebar left-header-sidebar"></div>
            <div className="video-page-logo">
              <Link to="/">
                <img src={logo} alt="Your Logo" style={{ height: "50px" }} />
              </Link>
            </div>
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
              <button
                className="icon-button"
                onClick={toggleAllBoxVisibility}
                title="Toggle Visibility for All Boxes"
              >
                <VisibilityIcon
                  style={{
                    color: allBoxesVisible ? "var(--highlight-text)" : "gray",
                  }}
                />
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
                  src={`${BASE_URL}/data/frames/${videoId}/frame${currentFrame}.jpg`}
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
                  setRunInterpolation={setRunInterpolation}
                  onInterpolationCompleted={onInterpolationCompleted}
                  selected={selected}
                  setSelected={setSelected}
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
                onDelete={deleteBoxAtIndex}
                boxClasses={classBoxes}
                setBoxClasses={setClassBoxes}
                onToggleInterpolation={toggleInterpolation}
                onChangeDisplayOrder={onChangeDisplayOrder}
                onToggleVisibility={toggleBoxVisibility}
                selected={selected}
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
