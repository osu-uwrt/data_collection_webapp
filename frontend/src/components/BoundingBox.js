import React, { useRef, useEffect, useState } from "react";

function BoundingBox({ videoWidth, videoHeight }) {
  const canvasRef = useRef(null);
  const [boxes, setBoxes] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [dragData, setDragData] = useState({ boxIndex: null, corner: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }, [videoWidth, videoHeight]);

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

    for (let i = 0; i < boxes.length; i++) {
      const corner = isWithinBoxCorner(x, y, boxes[i]);
      const side = isWithinBoxSide(x, y, boxes[i]);
      if (corner) {
        setDragging(true);
        setDragData({ boxIndex: i, corner });
        break;
      } else if (side) {
        setDragging(true);
        setDragData({ boxIndex: i, side });
        break;
      }
    }
  };
  const handleMouseMove = (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const canvas = canvasRef.current;

    let overCornerOrSide = false;

    if (!dragging) {
      for (let i = 0; i < boxes.length; i++) {
        const corner = isWithinBoxCorner(x, y, boxes[i]);
        const side = isWithinBoxSide(x, y, boxes[i]);
        if (corner) {
          overCornerOrSide = true;
          switch (corner) {
            case "topLeft":
            case "bottomRight":
              canvas.style.cursor = "nwse-resize";
              break;
            case "topRight":
            case "bottomLeft":
              canvas.style.cursor = "nesw-resize";
              break;
          }
          break;
        } else if (side) {
          overCornerOrSide = true;
          switch (side) {
            case "leftSide":
            case "rightSide":
              canvas.style.cursor = "ew-resize";
              break;
            case "topSide":
            case "bottomSide":
              canvas.style.cursor = "ns-resize";
              break;
          }
        }
      }

      if (!overCornerOrSide) {
        canvas.style.cursor = "default";
      }
    }

    if (!dragging) return;
    const currentBox = boxes[dragData.boxIndex];

    let newBox = { ...currentBox };

    switch (dragData.corner || dragData.side) {
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
      default:
        return;
    }

    const newBoxes = [...boxes];
    newBoxes[dragData.boxIndex] = newBox;
    setBoxes(newBoxes);
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      setDragData({ boxIndex: null, corner: null });
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
    boxes.forEach((box) => {
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      const cornerSize = 6; // Adjust if you need to change the size of the corner boxes
      const corners = [
        [box.x, box.y], // top-left
        [box.x + box.width, box.y], // top-right
        [box.x, box.y + box.height], // bottom-left
        [box.x + box.width, box.y + box.height], // bottom-right
      ];

      corners.forEach(([x, y]) => {
        ctx.fillRect(
          x - cornerSize / 2,
          y - cornerSize / 2,
          cornerSize,
          cornerSize
        );
      });
    });
  }, [boxes]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: 0, left: 0 }}
      onClick={(e) => {
        if (e.ctrlKey) {
          const boundingRect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - boundingRect.left - 50; // Centered bounding box
          const y = e.clientY - boundingRect.top - 50; // Centered bounding box

          setBoxes([...boxes, { x, y, width: 100, height: 100 }]);
        }
      }}
    />
  );
}

export default BoundingBox;
