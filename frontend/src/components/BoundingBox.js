import React, { useRef, useEffect, useState } from "react";

function BoundingBox({
  videoWidth,
  videoHeight,
  currentFrame,
  frameBoxes,
  setFrameBoxes,
  onDeleteRef,
}) {
  const canvasRef = useRef(null);
  const getCurrentBoxes = () => frameBoxes[currentFrame] || [];
  const [boxes, setBoxes] = useState(getCurrentBoxes());
  const [dragging, setDragging] = useState(false);
  const [dragData, setDragData] = useState({ boxIndex: null, corner: null });
  const [selected, setSelected] = useState(null);
  const [lastBoxSize, setLastBoxSize] = useState({ width: 100, height: 100 });

  useEffect(() => {
    setBoxes(getCurrentBoxes());
    setSelected(null);
  }, [currentFrame]);

  const handleDelete = () => {
    if (selected !== null) {
      const updatedBoxes = [...boxes];
      updatedBoxes.splice(selected, 1);
      setBoxes(updatedBoxes);
      setSelected(null);
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
    }
  };

  useEffect(() => {
    if (onDeleteRef && typeof onDeleteRef.current !== "undefined") {
      onDeleteRef.current = handleDelete;
    }
  }, [boxes, selected]);

  useEffect(() => {
    if (JSON.stringify(boxes) !== JSON.stringify(frameBoxes[currentFrame])) {
      setFrameBoxes((prevFrameBoxes) => ({
        ...prevFrameBoxes,
        [currentFrame]: boxes,
      }));
    }
  }, [boxes]);

  useEffect(() => {
    setFrameBoxes((prevFrameBoxes) => ({
      ...prevFrameBoxes,
      [currentFrame]: boxes,
    }));
  }, [boxes, currentFrame, setFrameBoxes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }, [videoWidth, videoHeight]);

  const boxStyles = {
    boxStrokeColor: "red",
    selectedBoxStrokeColor: "purple",
    boxStrokeWidth: 2,
    cornerFillColor: "blue",
    cornerSize: 6,
  };

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

    for (let i = 0; i < boxes.length; i++) {
      const corner = isWithinBoxCorner(x, y, boxes[i]);
      const side = isWithinBoxSide(x, y, boxes[i]);
      const middle = isWithinBox(x, y, boxes[i]);

      if (corner || side || middle) {
        setDragging(true);
        newlySelectedBoxIndex = i;
        setLastBoxSize({
          width: boxes[i].width,
          height: boxes[i].height,
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

    if (dragData.boxIndex !== null && dragData.boxIndex >= boxes.length) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (!dragging) {
      let cursorStyle = "default";
      for (let i = boxes.length - 1; i >= 0; i--) {
        const corner = isWithinBoxCorner(x, y, boxes[i]);
        const side = isWithinBoxSide(x, y, boxes[i]);
        const middle = isWithinBox(x, y, boxes[i]);

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
    const currentBox = boxes[dragData.boxIndex];

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
    const newBoxes = [...boxes];
    newBoxes[dragData.boxIndex] = newBox;
    setBoxes(newBoxes);
  };

  const handleMouseUp = () => {
    if (dragData.boxIndex !== null && dragData.boxIndex >= boxes.length) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
      return;
    }

    if (dragging && dragData.boxIndex !== null) {
      setLastBoxSize({
        width: boxes[dragData.boxIndex].width,
        height: boxes[dragData.boxIndex].height,
      });
      setDragging(false);

      const normalizedBox = normalizeBox(boxes[dragData.boxIndex]);
      const newBoxes = [...boxes];
      newBoxes[dragData.boxIndex] = normalizedBox;
      setBoxes(newBoxes);

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
  }, [boxes, dragging, dragData]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    boxes.forEach((box, index) => {
      ctx.strokeStyle =
        selected === index
          ? boxStyles.selectedBoxStrokeColor
          : boxStyles.boxStrokeColor;
      ctx.lineWidth = boxStyles.boxStrokeWidth;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      const corners = [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x, box.y + box.height],
        [box.x + box.width, box.y + box.height],
      ];

      ctx.fillStyle = boxStyles.cornerFillColor;
      corners.forEach(([x, y]) => {
        ctx.fillRect(
          x - boxStyles.cornerSize / 2,
          y - boxStyles.cornerSize / 2,
          boxStyles.cornerSize,
          boxStyles.cornerSize
        );
      });
    });
  }, [boxes, selected]);

  const createBox = (x, y) => {
    let newBox = {
      x: x - lastBoxSize.width / 2,
      y: y - lastBoxSize.height / 2,
      width: lastBoxSize.width,
      height: lastBoxSize.height,
    };

    newBox = clampBoxToCanvas(newBox, videoWidth, videoHeight);
    setBoxes((prevBoxes) => [...prevBoxes, newBox]);
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
