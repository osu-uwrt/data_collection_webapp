import React, { useRef, useEffect, useState } from "react";

function BoundingBox({
  videoWidth,
  videoHeight,
  currentFrame,
  frameBoxes,
  setFrameBoxes,
  onDeleteRef,
  boxClasses,
}) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragData, setDragData] = useState({ boxIndex: null, corner: null });
  const [selected, setSelected] = useState(null);
  const [lastBoxSize, setLastBoxSize] = useState({ width: 100, height: 100 });

  const handleDelete = () => {
    if (selected !== null) {
      const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
      updatedBoxesForFrame.splice(selected, 1);
      setFrameBoxes((prev) => ({
        ...prev,
        [currentFrame]: updatedBoxesForFrame,
      }));
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
    const cornerSize = 20;
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

    return normalizedBox;
  };

  const isWithinBoxSide = (x, y, box) => {
    const sideThreshold = 10;
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

    const updatedBoxesForFrame = [...frameBoxes[currentFrame]];
    updatedBoxesForFrame[dragData.boxIndex] = newBox;
    setFrameBoxes((prev) => ({
      ...prev,
      [currentFrame]: updatedBoxesForFrame,
    }));
  };

  const handleMouseUp = () => {
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
        ctx.strokeStyle = "rgba(255, 0, 0, 1)";
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = strokeColor || "white";
      }

      ctx.strokeStyle = strokeColor || "white";
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

      ctx.fillStyle = fillColor || "rgba(255, 255, 255, 0.25)";
      ctx.fill();
      ctx.stroke();
    });
  }, [frameBoxes, boxClasses, selected, currentFrame]);

  const createBox = (x, y) => {
    let newBox = {
      x: x - lastBoxSize.width / 2,
      y: y - lastBoxSize.height / 2,
      width: lastBoxSize.width,
      height: lastBoxSize.height,
      class: "class1",
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
        if (e.ctrlKey) {
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
