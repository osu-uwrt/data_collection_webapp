import React, { useRef, useEffect, useState, useCallback } from "react";
import { updateInterpolationNumbers } from "./utils";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";

//DRAG OFF CANVAS FIX

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function BoundingBox({
  videoWidth,
  videoHeight,
  currentFrame,
  frameBoxes,
  setFrameBoxes,
  onDeleteRef,
  boxClasses,
  showLabels,
  runInterpolation,
  onInterpolationCompleted,
}) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragData, setDragData] = useState({ boxIndex: null, corner: null });
  const [selected, setSelected] = useState(null);
  const [lastBoxSize, setLastBoxSize] = useState({ width: 100, height: 100 });
  const [creatingBox, setCreatingBox] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [lastSelectedClass, setLastSelectedClass] = useState("class1");
  const [lastInterpolate, setLastInterpolate] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [currentFrameBoxes, setCurrentFrameBoxes] = useState([]);

  const MIN_WIDTH = 10;
  const MIN_HEIGHT = 10;

  const handleDelete = useCallback(() => {
    if (selected !== null) {
      const updatedBoxesForFrame = [currentFrameBoxes];
      updatedBoxesForFrame.splice(selected, 1);
      setCurrentFrameBoxes(updatedBoxesForFrame);
      if (currentFrameBoxes) {
        updateInterpolationNumbers(currentFrameBoxes);
      }
      setSelected(null);
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
    }
  }, [currentFrameBoxes]);

  useEffect(() => {
    setCurrentFrameBoxes(frameBoxes[currentFrame]);
    console.log("currentFrameBoxes", currentFrameBoxes);
  }, [currentFrame, frameBoxes]);

  useEffect(() => {
    setSelected(null);
  }, [currentFrame]);

  useEffect(() => {
    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: currentFrameBoxes,
    }));
  }, [currentFrameBoxes.length]);

  useEffect(() => {
    if (onDeleteRef && typeof onDeleteRef.current !== "undefined") {
      onDeleteRef.current = handleDelete;
    }
  }, [currentFrameBoxes, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }, [videoWidth, videoHeight]);

  const clampBoxToCanvas = (box, canvasWidth, canvasHeight) => {
    const clampedBox = { ...box };

    if (clampedBox.x < 0) {
      clampedBox.x = 0;
    }
    if (clampedBox.y < 0) {
      clampedBox.y = 0;
    }
    if (clampedBox.x + clampedBox.width > canvasWidth) {
      clampedBox.x = canvasWidth - clampedBox.width;
    }
    if (clampedBox.y + clampedBox.height > canvasHeight) {
      clampedBox.y = canvasHeight - clampedBox.height;
    }

    return clampedBox;
  };

  const isWithinBoxCorner = (x, y, box) => {
    const cornerSize = 10;
    const corners = {
      topLeft: { x: box.x, y: box.y },
      topRight: { x: box.x + box.width, y: box.y },
      bottomLeft: { x: box.x, y: box.y + box.height },
      bottomRight: { x: box.x + box.width, y: box.y + box.height },
    };

    for (let corner in corners) {
      const c = corners[corner];
      if (
        x > c.x - cornerSize / 2 &&
        x < c.x + cornerSize / 2 &&
        y > c.y - cornerSize / 2 &&
        y < c.y + cornerSize / 2
      ) {
        return corner;
      }
    }

    return null;
  };

  const isWithinBox = (x, y, box) => {
    if (
      y > box.y &&
      y < box.y + box.height &&
      x > box.x &&
      x < box.x + box.width
    ) {
      return "middle";
    }
    return null;
  };

  const normalizeBox = (box) => {
    let normalizedBox = { ...box };

    if (normalizedBox.width < 0) {
      normalizedBox.x += normalizedBox.width;
      normalizedBox.width = Math.abs(normalizedBox.width);
    }

    if (normalizedBox.height < 0) {
      normalizedBox.y += normalizedBox.height;
      normalizedBox.height = Math.abs(normalizedBox.height);
    }

    normalizedBox.width = Math.max(normalizedBox.width, MIN_WIDTH);
    normalizedBox.height = Math.max(normalizedBox.height, MIN_HEIGHT);

    return normalizedBox;
  };

  const isWithinBoxSide = (x, y, box) => {
    const sideThreshold = 3;
    if (y > box.y && y < box.y + box.height) {
      if (Math.abs(x - box.x) < sideThreshold) return "leftSide";
      if (Math.abs(x - box.x - box.width) < sideThreshold) return "rightSide";
    }
    if (x > box.x && x < box.x + box.width) {
      if (Math.abs(y - box.y) < sideThreshold) return "topSide";
      if (Math.abs(y - box.y - box.height) < sideThreshold) return "bottomSide";
    }
    return null;
  };

  const toggleBoxVisibility = useCallback(() => {
    if (selected !== null) {
      const updatedBoxesForFrame = [currentFrameBoxes];
      updatedBoxesForFrame[selected].visible =
        !updatedBoxesForFrame[selected].visible;
      setCurrentFrameBoxes(updatedBoxesForFrame);
    }
  }, [selected, currentFrameBoxes]);

  const handleMouseDown = useCallback(
    (event) => {
      const x = event.offsetX;
      const y = event.offsetY;
      let newlySelectedBoxIndex = null;
      setDragging(false);

      if (event.ctrlKey) {
        setCreatingBox(true);
        setInitialPosition({ x, y });
        const newBox = {
          x: x,
          y: y,
          width: 0,
          height: 0,
          class: lastSelectedClass,
          interpolate: lastInterpolate,
          interpolationNumber: null,
          interpolationID: null,
          displayOrder: null,
          visible: true,
        };

        const currentBoxes = [...(currentFrameBoxes || [])];

        // Sort the current boxes by their displayOrder
        currentBoxes.sort((a, b) => a.displayOrder - b.displayOrder);
        currentBoxes.forEach((box, index) => {
          box.displayOrder = index + 1; // increment displayOrder for existing boxes
        });

        newBox.displayOrder = 0; // new box will always be on top based on your previous logic

        setCurrentFrameBoxes([newBox, ...currentBoxes]);
        setDragData({ boxIndex: 0 }); // Since newBox is at the start of the array

        if (currentFrameBoxes) {
          updateInterpolationNumbers(currentFrameBoxes);
        }

        return;
      }

      if (!currentFrameBoxes) return;
      for (let i = 0; i < currentFrameBoxes.length; i++) {
        if (currentFrameBoxes[i].visible) {
          const corner = isWithinBoxCorner(x, y, currentFrameBoxes[i]);
          const side = isWithinBoxSide(x, y, currentFrameBoxes[i]);
          const middle = isWithinBox(x, y, currentFrameBoxes[i]);

          if (corner || side || middle) {
            setDragging(true);
            newlySelectedBoxIndex = i;
            setLastBoxSize({
              width: currentFrameBoxes[i].width,
              height: currentFrameBoxes[i].height,
            });
            setLastSelectedClass(currentFrameBoxes[i].class);
            setLastInterpolate(currentFrameBoxes[i].interpolate);
            if (corner) {
              setDragData({ boxIndex: i, corner });
              break;
            } else if (side) {
              setDragData({ boxIndex: i, side });
              break;
            } else if (middle) {
              setDragData({ boxIndex: i, middle, startX: x, startY: y });
              break;
            }
          }
        }
      }
      console.log("index", newlySelectedBoxIndex);
      console.log("dragging", dragging);

      if (newlySelectedBoxIndex === null && !dragging) {
        setSelected(null);
        console.log("A");
      } else if (newlySelectedBoxIndex !== null) {
        setSelected(newlySelectedBoxIndex);
        setLastSelectedClass(currentFrameBoxes[newlySelectedBoxIndex].class);
        console.log("B");
      }
    },
    [currentFrameBoxes]
  );

  const handleMouseMove = (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const canvas = canvasRef.current;

    if (
      dragData.boxIndex !== null &&
      currentFrameBoxes &&
      dragData.boxIndex >= currentFrameBoxes.length
    ) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (!dragging) {
      let cursorStyle = "default";
      if (creatingBox) {
        const currentBox = currentFrameBoxes[dragData.boxIndex];
        let newBox = { ...currentBox };
        newBox.width = x - initialPosition.x;
        newBox.height = y - initialPosition.y;
        const updatedBoxesForFrame = [...currentFrameBoxes];
        updatedBoxesForFrame[dragData.boxIndex] = newBox;
        setCurrentFrameBoxes(updatedBoxesForFrame);
        return;
      }

      if (!currentFrameBoxes) return;
      for (let i = currentFrameBoxes.length - 1; i >= 0; i--) {
        if (currentFrameBoxes[i].visible) {
          const corner = isWithinBoxCorner(x, y, currentFrameBoxes[i]);
          const side = isWithinBoxSide(x, y, currentFrameBoxes[i]);
          const middle = isWithinBox(x, y, currentFrameBoxes[i]);

          if (corner) {
            switch (corner) {
              case "topLeft":
              case "bottomRight":
                cursorStyle = "nwse-resize";
                break;
              case "topRight":
              case "bottomLeft":
                cursorStyle = "nesw-resize";
                break;
              default:
                break;
            }
          } else if (side) {
            switch (side) {
              case "leftSide":
              case "rightSide":
                cursorStyle = "ew-resize";
                break;
              case "topSide":
              case "bottomSide":
                cursorStyle = "ns-resize";
                break;
              default:
                break;
            }
          } else if (middle) {
            cursorStyle = "move";
          }
        }

        canvas.style.cursor = cursorStyle;
      }
    }

    if (!dragging) return;
    const currentBox = currentFrameBoxes[dragData.boxIndex];

    let newBox = { ...currentBox };

    switch (dragData.corner || dragData.side || dragData.middle) {
      case "topLeft":
        newBox.width += newBox.x - x;
        newBox.height += newBox.y - y;
        newBox.x = x;
        newBox.y = y;
        break;
      case "topRight":
        newBox.width = x - newBox.x;
        newBox.height += newBox.y - y;
        newBox.y = y;
        break;
      case "bottomLeft":
        newBox.width += newBox.x - x;
        newBox.x = x;
        newBox.height = y - newBox.y;
        break;
      case "bottomRight":
        newBox.width = x - newBox.x;
        newBox.height = y - newBox.y;
        break;
      case "leftSide":
        newBox.width += newBox.x - x;
        newBox.x = x;
        break;
      case "rightSide":
        newBox.width = x - newBox.x;
        break;
      case "topSide":
        newBox.height += newBox.y - y;
        newBox.y = y;
        break;
      case "bottomSide":
        newBox.height = y - newBox.y;
        break;
      case "middle":
        const dx = x - dragData.startX;
        const dy = y - dragData.startY;

        newBox.x += dx;
        newBox.y += dy;

        setDragData((prevDragData) => ({
          ...prevDragData,
          startX: x,
          startY: y,
        }));
        break;

      default:
        return;
    }

    newBox = clampBoxToCanvas(newBox, videoWidth, videoHeight);
    const updatedBoxesForFrame = [...currentFrameBoxes];
    updatedBoxesForFrame[dragData.boxIndex] = newBox;
    setCurrentFrameBoxes(updatedBoxesForFrame);
  };

  const resetInterpolationFlags = (frameBoxes) => {
    for (let frame in frameBoxes) {
      frameBoxes[frame].forEach((box) => {
        box.interpolate = false;
        box.interpolationNumber = null;
        box.interpolationID = null;
      });
    }
  };

  const validateInterpolation = (frameBoxes) => {
    let activeInterpolationFrames = [];
    let activeInterpolationSignatures = {};

    for (let frame in frameBoxes) {
      const boxes = frameBoxes[frame].filter((box) => box.interpolate);
      if (boxes.length > 0) {
        activeInterpolationFrames.push(frame);

        let frameSignature = boxes
          .map((box) => {
            return `${box.class}_${box.interpolationNumber}_${box.interpolationID}`;
          })
          .sort()
          .join(",");

        activeInterpolationSignatures[frame] = frameSignature;
      }
    }

    if (activeInterpolationFrames.length < 2) {
      setSnackbarMessage(
        "Interpolation failed: Less than 2 frames have boxes flagged for interpolation."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }

    let referenceFrame = activeInterpolationFrames[0];
    let referenceSignature = activeInterpolationSignatures[referenceFrame];
    let referenceSignaturesSet = new Set(referenceSignature.split(","));

    for (let frame of activeInterpolationFrames.slice(1)) {
      const currentBoxesSignature =
        activeInterpolationSignatures[frame].split(",");
      const currentSignatureSet = new Set(currentBoxesSignature);

      if (referenceSignaturesSet.size !== currentSignatureSet.size) {
        setSnackbarMessage(
          `Interpolation failed: Inconsistent number of boxes flagged for interpolation. Found ${referenceSignaturesSet.size} on frame ${referenceFrame} and ${currentSignatureSet.size} on frame ${frame}.`
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return false;
      }

      for (let signature of referenceSignaturesSet) {
        if (!currentSignatureSet.has(signature)) {
          setSnackbarMessage(
            `Interpolation failed: Mismatch in classes of boxes flagged for interpolation between frame ${referenceFrame} and frame ${frame}.`
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          return false;
        }
      }
    }

    return true;
  };

  const performInterpolation = (frameBoxes) => {
    const sortedFrames = Object.keys(frameBoxes).sort((a, b) => a - b);
    let startFrame = null;

    for (let i = 0; i < sortedFrames.length; i++) {
      const frame = sortedFrames[i];
      if (frameBoxes[frame].some((box) => box.interpolate)) {
        if (startFrame === null) {
          startFrame = frame;
        } else {
          const endFrame = frame;

          frameBoxes[startFrame].forEach((startBox) => {
            if (!startBox.interpolate) {
              return;
            }

            const endBox = frameBoxes[endFrame].find(
              (box) =>
                box.interpolationID === startBox.interpolationID &&
                box.interpolate
            );

            if (!endBox) {
              return;
            }

            for (let j = parseInt(startFrame) + 1; j < endFrame; j++) {
              if (!frameBoxes[j]) {
                frameBoxes[j] = [];
              }
              const alpha = (j - startFrame) / (endFrame - startFrame);
              const interpolatedBox = {
                x: startBox.x + alpha * (endBox.x - startBox.x),
                y: startBox.y + alpha * (endBox.y - startBox.y),
                width: startBox.width + alpha * (endBox.width - startBox.width),
                height:
                  startBox.height + alpha * (endBox.height - startBox.height),
                class: startBox.class,
                interpolate: false,
                interpolationNumber: null,
                interpolationID: startBox.interpolationID,
                displayOrder: null,
                visible: true,
              };

              const correctIndex = frameBoxes[j].findIndex(
                (box) => box.interpolationID === interpolatedBox.interpolationID
              );

              if (correctIndex === -1) {
                frameBoxes[j].push(interpolatedBox);
              } else {
                frameBoxes[j][correctIndex] = interpolatedBox;
              }
            }
          });
          startFrame = endFrame;
        }
      }
    }
    return frameBoxes;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "v" || event.key === "V") {
        toggleBoxVisibility();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleBoxVisibility]);

  useEffect(() => {
    if (runInterpolation) {
      if (validateInterpolation(frameBoxes)) {
        performInterpolation(frameBoxes);
        resetInterpolationFlags(frameBoxes);

        setSnackbarMessage(`Interpolation successful!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        console.log("Invalid Interpolation");
      }
      if (onInterpolationCompleted) {
        console.log("Interpolation Completed");
        onInterpolationCompleted();
      }
    }
  }, [runInterpolation]);

  const handleMouseUp = () => {
    if (!currentFrameBoxes) return;
    if (creatingBox) {
      setCreatingBox(false);
      const normalizedBox = normalizeBox(currentFrameBoxes[dragData.boxIndex]);

      if (
        normalizedBox.width < MIN_WIDTH ||
        normalizedBox.height < MIN_HEIGHT
      ) {
        const updatedBoxesForFrame = currentFrameBoxes;
        updatedBoxesForFrame.splice(dragData.boxIndex, 1);
        setCurrentFrameBoxes(updatedBoxesForFrame);
        setDragData({ boxIndex: null, corner: null });
        return;
      }

      setLastBoxSize({
        width: normalizedBox.width,
        height: normalizedBox.height,
      });
      setLastSelectedClass(normalizedBox.class);
      setLastInterpolate(normalizedBox.interpolate);

      const updatedBoxesForFrame = currentFrameBoxes;
      updatedBoxesForFrame[dragData.boxIndex] = normalizedBox;
      setCurrentFrameBoxes(updatedBoxesForFrame);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (
      dragData.boxIndex !== null &&
      currentFrameBoxes &&
      dragData.boxIndex >= (currentFrameBoxes || []).length
    ) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (dragging && dragData.boxIndex !== null) {
      setLastBoxSize({
        width: currentFrameBoxes[dragData.boxIndex].width,
        height: currentFrameBoxes[dragData.boxIndex].height,
      });
      setLastSelectedClass(currentFrameBoxes[dragData.boxIndex].class);
      setLastInterpolate(currentFrameBoxes[dragData.boxIndex].interpolate);
      setDragging(false);

      const normalizedBox = normalizeBox(currentFrameBoxes[dragData.boxIndex]);
      const updatedBoxesForFrame = currentFrameBoxes;
      updatedBoxesForFrame[dragData.boxIndex] = normalizedBox;

      setCurrentFrameBoxes(updatedBoxesForFrame);
      setDragData({ boxIndex: null, corner: null, startX: null, startY: null });
    }
    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: currentFrameBoxes,
    }));
  };

  useEffect(() => {
    if (currentFrameBoxes) {
      updateInterpolationNumbers(currentFrameBoxes);
    }
  }, [currentFrameBoxes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    const boxesForRendering = [...(currentFrameBoxes || [])].filter(
      (box) => box.visible
    );

    // Sort the cloned boxes in descending order for rendering
    const sortedBoxes = boxesForRendering.sort(
      (a, b) => b.displayOrder - a.displayOrder
    );

    sortedBoxes.forEach((box, index) => {
      const boxClass = box.class || "default";
      const { strokeColor } = boxClasses[boxClass] || {};

      let positionAfterSorting = sortedBoxes.findIndex(
        (b) =>
          currentFrameBoxes[selected] &&
          b.displayOrder === currentFrameBoxes[selected].displayOrder
      );
      const isBoxSelected = index === positionAfterSorting;

      if (isBoxSelected) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = strokeColor || "white";
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = strokeColor || "white";
      }

      ctx.lineWidth = 2;

      const radius = 2;
      ctx.beginPath();
      ctx.moveTo(box.x + radius, box.y);
      ctx.lineTo(box.x + box.width - radius, box.y);
      ctx.quadraticCurveTo(
        box.x + box.width,
        box.y,
        box.x + box.width,
        box.y + radius
      );
      ctx.lineTo(box.x + box.width, box.y + box.height - radius);
      ctx.quadraticCurveTo(
        box.x + box.width,
        box.y + box.height,
        box.x + box.width - radius,
        box.y + box.height
      );
      ctx.lineTo(box.x + radius, box.y + box.height);
      ctx.quadraticCurveTo(
        box.x,
        box.y + box.height,
        box.x,
        box.y + box.height - radius
      );
      ctx.lineTo(box.x, box.y + radius);
      ctx.quadraticCurveTo(box.x, box.y, box.x + radius, box.y);
      ctx.closePath();

      ctx.fillStyle = strokeColor || "white";
      ctx.globalAlpha = 0.3;

      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      if (showLabels) {
        let label = box.class || "default";

        if (box.interpolate) {
          label += ` (${box.interpolationNumber || "N/A"})`;
        }

        ctx.font = "14px Arial";

        const metrics = ctx.measureText(label);
        const labelWidth = metrics.width + 10;
        const labelHeight = 20;

        let labelX = box.x;
        let labelY;

        if (box.y - labelHeight >= 0) {
          labelY = box.y - labelHeight;
        } else if (box.y + box.height + labelHeight <= ctx.canvas.height) {
          labelY = box.y + box.height;
        } else {
          labelY = box.y;
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;

        ctx.fillText(label, labelX + 5, labelY + 15);

        ctx.shadowColor = "transparent";
      }
    });
  }, [currentFrameBoxes, boxClasses, selected, showLabels]);

  const createBox = (x, y) => {
    let newBox = {
      x: x - lastBoxSize.width / 2,
      y: y - lastBoxSize.height / 2,
      width: lastBoxSize.width,
      height: lastBoxSize.height,
      class: lastSelectedClass,
      interpolate: lastInterpolate,
      interpolationNumber: null,
      interpolationID: null,
      displayOrder: null,
      visible: true,
    };

    const currentBoxes = currentFrameBoxes || [];
    console.log("currentBoxes", currentBoxes);
    // Sort the current boxes by their displayOrder
    currentBoxes.sort((a, b) => a.displayOrder - b.displayOrder);
    currentBoxes.forEach((box, index) => {
      box.displayOrder = index + 1; // increment displayOrder to make room for the new box at position 0
    });

    newBox.displayOrder = 0; // new box will always be on top based on your previous logic

    newBox = normalizeBox(newBox);
    newBox = clampBoxToCanvas(newBox, videoWidth, videoHeight);

    setCurrentFrameBoxes([newBox, ...currentBoxes]);

    if (currentFrameBoxes) {
      updateInterpolationNumbers(currentFrameBoxes);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
        onClick={(e) => {
          if (e.shiftKey) {
            const boundingRect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - boundingRect.left;
            const y = e.clientY - boundingRect.top;
            createBox(x, y);
          }
        }}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        TransitionComponent={TransitionRight}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default BoundingBox;
