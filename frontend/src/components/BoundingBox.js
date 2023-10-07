import React, { useRef, useEffect, useState } from "react";
import { updateInterpolationNumbers } from "./utils";

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

  const MIN_WIDTH = 10;
  const MIN_HEIGHT = 10;

  const handleDelete = () => {
    if (selected !== null) {
      const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
      updatedBoxesForFrame.splice(selected, 1);
      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
      updateInterpolationNumbers(updatedBoxesForFrame);
      setSelected(null);
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
    }
  };

  useEffect(() => {
    setSelected(null);
  }, [currentFrame]);

  useEffect(() => {
    if (onDeleteRef && typeof onDeleteRef.current !== "undefined") {
      onDeleteRef.current = handleDelete;
    }
  }, [frameBoxes[currentFrame], selected]);

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

  const handleMouseDown = (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    let newlySelectedBoxIndex = null;

    if (event.ctrlKey) {
      setCreatingBox(true);
      setInitialPosition({ x, y });
      const newBox = {
        x: x,
        y: y,
        width: 0,
        height: 0,
        class: lastSelectedClass,
        interpolate: false,
        interpolationNumber: null,
      };
      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: [...(frameBoxes[currentFrame] || []), newBox],
      }));
      setDragData({ boxIndex: frameBoxes[currentFrame]?.length || 0 }); // Assuming boxIndex is set to the last box in the array
      return;
    }
    if (!frameBoxes[currentFrame]) return;
    for (let i = 0; i < frameBoxes[currentFrame].length; i++) {
      const corner = isWithinBoxCorner(x, y, frameBoxes[currentFrame][i]);
      const side = isWithinBoxSide(x, y, frameBoxes[currentFrame][i]);
      const middle = isWithinBox(x, y, frameBoxes[currentFrame][i]);

      if (corner || side || middle) {
        setDragging(true);
        newlySelectedBoxIndex = i;
        setLastBoxSize({
          width: frameBoxes[currentFrame][i].width,
          height: frameBoxes[currentFrame][i].height,
        });
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

    if (newlySelectedBoxIndex === null && !dragging) {
      setSelected(null);
    } else if (newlySelectedBoxIndex !== null) {
      setSelected(newlySelectedBoxIndex);
      setLastSelectedClass(
        frameBoxes[currentFrame][newlySelectedBoxIndex].class
      );
    }
  };

  const handleMouseMove = (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const canvas = canvasRef.current;

    if (
      dragData.boxIndex !== null &&
      frameBoxes[currentFrame] &&
      dragData.boxIndex >= frameBoxes[currentFrame].length
    ) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (!dragging) {
      let cursorStyle = "default";
      if (creatingBox) {
        const currentBox = frameBoxes[currentFrame][dragData.boxIndex];
        let newBox = { ...currentBox };
        newBox.width = x - initialPosition.x;
        newBox.height = y - initialPosition.y;
        const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
        updatedBoxesForFrame[dragData.boxIndex] = newBox;
        setFrameBoxes((prev) => ({
          ...prev,
          [currentFrame]: updatedBoxesForFrame,
        }));
        return;
      }

      if (!frameBoxes[currentFrame]) return;
      for (let i = frameBoxes[currentFrame].length - 1; i >= 0; i--) {
        const corner = isWithinBoxCorner(x, y, frameBoxes[currentFrame][i]);
        const side = isWithinBoxSide(x, y, frameBoxes[currentFrame][i]);
        const middle = isWithinBox(x, y, frameBoxes[currentFrame][i]);

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

    if (!dragging) return;
    const currentBox = frameBoxes[currentFrame][dragData.boxIndex];

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
    const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
    updatedBoxesForFrame[dragData.boxIndex] = newBox;
    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: updatedBoxesForFrame,
    }));
  };

  const resetInterpolationFlags = (frameBoxes) => {
    for (let frame in frameBoxes) {
      frameBoxes[frame].forEach((box) => {
        box.interpolate = false;
        box.interpolationNumber = null;
      });
    }
  };

  const removeDuplicateBoxes = (frameBoxes) => {
    for (let frame in frameBoxes) {
      let uniqueBoxes = [];
      let seenBoxStrings = new Set();

      frameBoxes[frame].forEach((box) => {
        const boxString = JSON.stringify(box);
        if (!seenBoxStrings.has(boxString)) {
          seenBoxStrings.add(boxString);
          uniqueBoxes.push(box);
        }
      });

      frameBoxes[frame] = uniqueBoxes;
    }
  };

  const validateInterpolation = (frameBoxes) => {
    let activeInterpolationFrames = [];
    let activeInterpolationCounts = {};

    console.log("Starting validateInterpolation...");

    for (let frame in frameBoxes) {
      const boxes = frameBoxes[frame].filter((box) => box.interpolate);
      if (boxes.length > 0) {
        activeInterpolationFrames.push(frame);
        let frameBoxCounts = {};
        boxes.forEach((box) => {
          const className = box.class;
          frameBoxCounts[className] = (frameBoxCounts[className] || 0) + 1;
        });
        activeInterpolationCounts[frame] = frameBoxCounts;
      }
    }

    console.log("Active interpolation frames:", activeInterpolationFrames);
    console.log(
      "Active interpolation counts by frame:",
      activeInterpolationCounts
    );

    if (activeInterpolationFrames.length < 2) {
      console.log("Less than 2 active interpolation frames. Exiting...");
      return false;
    }

    let referenceFrameCounts =
      activeInterpolationCounts[activeInterpolationFrames[0]];
    for (let frame of activeInterpolationFrames.slice(1)) {
      let currentFrameCounts = activeInterpolationCounts[frame];

      console.log(`Frame ${frame} counts:`, currentFrameCounts);

      for (let className in referenceFrameCounts) {
        if (currentFrameCounts[className] !== referenceFrameCounts[className]) {
          console.log(
            `Inconsistent counts for class ${className}. Expected: ${referenceFrameCounts[className]}, Found: ${currentFrameCounts[className]}`
          );
          return false;
        }
      }
    }

    console.log("Validation passed.");
    return true;
  };

  const reindexBoxes = (frameBoxes) => {
    let referenceFrame = null;
    for (let frame in frameBoxes) {
      if (frameBoxes[frame].some((box) => box.interpolate)) {
        referenceFrame = frame;
        break;
      }
    }

    if (!referenceFrame) return;

    let referenceOrder = frameBoxes[referenceFrame].map((box) => box.class);

    console.log("Reference frame:", referenceFrame);
    console.log("Reference order:", referenceOrder);

    for (let frame in frameBoxes) {
      let sortedBoxes = [];

      referenceOrder.forEach((refClass) => {
        let boxesWithRefClass = frameBoxes[frame].filter(
          (box) => box.class === refClass
        );
        sortedBoxes = sortedBoxes.concat(boxesWithRefClass);
      });

      frameBoxes[frame] = sortedBoxes;

      console.log(
        `Boxes in frame ${frame} after reindexing:`,
        frameBoxes[frame]
      );
    }
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

          frameBoxes[startFrame].forEach((startBox, startBoxIndex) => {
            if (!startBox.interpolate) {
              return;
            }

            const endBox = frameBoxes[endFrame].find(
              (box) => box.class === startBox.class && box.interpolate
            );

            if (!endBox) {
              return;
            }

            for (let j = parseInt(startFrame) + 1; j < endFrame; j++) {
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
              };

              const correctIndex = frameBoxes[j].findIndex(
                (box) => box.class === interpolatedBox.class
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
    if (runInterpolation) {
      if (validateInterpolation(frameBoxes)) {
        console.log("Interpolation Validated");
        reindexBoxes(frameBoxes);
        removeDuplicateBoxes(frameBoxes);
        console.log("boxes reindexed");
        performInterpolation(frameBoxes);
        resetInterpolationFlags(frameBoxes);
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
    if (!frameBoxes[currentFrame]) return;
    if (creatingBox) {
      setCreatingBox(false);
      const normalizedBox = normalizeBox(
        frameBoxes[currentFrame][dragData.boxIndex]
      );

      if (
        normalizedBox.width < MIN_WIDTH ||
        normalizedBox.height < MIN_HEIGHT
      ) {
        const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
        updatedBoxesForFrame.splice(dragData.boxIndex, 1);
        setFrameBoxes((prev) => ({
          ...prev,
          [currentFrame]: updatedBoxesForFrame,
        }));
        setDragData({ boxIndex: null, corner: null });
        return;
      }

      setLastBoxSize({
        width: normalizedBox.width,
        height: normalizedBox.height,
      });

      const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
      updatedBoxesForFrame[dragData.boxIndex] = normalizedBox;
      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (
      dragData.boxIndex !== null &&
      frameBoxes[currentFrame] &&
      dragData.boxIndex >= (frameBoxes[currentFrame] || []).length
    ) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (dragging && dragData.boxIndex !== null) {
      setLastBoxSize({
        width: frameBoxes[currentFrame][dragData.boxIndex].width,
        height: frameBoxes[currentFrame][dragData.boxIndex].height,
      });
      setDragging(false);

      const normalizedBox = normalizeBox(
        frameBoxes[currentFrame][dragData.boxIndex]
      );
      const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
      updatedBoxesForFrame[dragData.boxIndex] = normalizedBox;

      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));

      setDragData({ boxIndex: null, corner: null, startX: null, startY: null });
    }
  };

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
  }, [frameBoxes[currentFrame], dragging, dragData]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    (frameBoxes[currentFrame] || []).forEach((box, index) => {
      const boxClass = box.class || "default";
      const { strokeColor, fillColor } = boxClasses[boxClass] || {};

      const isBoxSelected = index === selected;

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
  }, [frameBoxes, boxClasses, selected, currentFrame, showLabels]);

  const createBox = (x, y) => {
    let newBox = {
      x: x - lastBoxSize.width / 2,
      y: y - lastBoxSize.height / 2,
      width: lastBoxSize.width,
      height: lastBoxSize.height,
      class: lastSelectedClass,
      interpolate: false,
      interpolationNumber: null,
    };

    newBox = clampBoxToCanvas(newBox, videoWidth, videoHeight);
    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: [...(frameBoxes[currentFrame] || []), newBox],
    }));
  };

  return (
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
  );
}

export default BoundingBox;
