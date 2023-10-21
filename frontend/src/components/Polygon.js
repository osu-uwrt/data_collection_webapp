import React, { useRef, useEffect, useState, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import { polygon, unkinkPolygon, area, booleanWithin } from "@turf/turf";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const SOME_THRESHOLD = 10;

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function pointExistsAtPosition(points, x, y) {
  return points.some((point) => point.x === x && point.y === y);
}

function calculateDistance(point1, point2) {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

function useShiftKeyPress() {
  const [isShiftDown, setIsShiftDown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Shift") {
        setIsShiftDown(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Shift") {
        setIsShiftDown(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return isShiftDown;
}

function Polygon() {
  const [mousePosition, setMousePosition] = useState(null);
  const isShiftDown = useShiftKeyPress();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [hoveringOverFirstPoint, setHoveringOverFirstPoint] = useState(false);
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [completedPolygons, setCompletedPolygons] = useState([]);

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

  const handleMouseMove = useCallback(
    (event) => {
      const x = event.offsetX;
      const y = event.offsetY;

      setMousePosition({ x, y });

      if (points.length) {
        const distance = calculateDistance(points[0], { x, y });
        setHoveringOverFirstPoint(distance < SOME_THRESHOLD);
      }

      if (
        isShiftDown &&
        isMousePressed &&
        !pointExistsAtPosition(points, x, y)
      ) {
        const lastPoint = points[points.length - 1];
        if (lastPoint) {
          const dist = calculateDistance(lastPoint, { x, y });
          if (dist < SOME_THRESHOLD * 1.5) {
            return;
          }
        }

        setPoints((prevPoints) => [...prevPoints, { x, y }]);
      }
    },
    [isShiftDown, isMousePressed, points]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
    }
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.lineWidth = 2;
    // Define default colors
    let strokeColor = "white";
    let fillColor = "white";

    // Check if the current polygon is simple or not
    if (points.length > 2) {
      const currentPolygon = points.map((p) => [p.x, p.y]);
      currentPolygon.push([points[0].x, points[0].y]); // Close the polygon
    }

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.3;

    // Draw completed polygons
    completedPolygons.forEach((polygon) => {
      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      polygon.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath(); // Close the path to complete the polygon
      ctx.stroke();
      ctx.fill();
    });

    // Draw current points
    if (points.length) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      // Draw a line from the last clicked point to the current mouse position
      if (mousePosition) {
        ctx.lineTo(mousePosition.x, mousePosition.y);
        if (hoveringOverFirstPoint) {
          ctx.globalAlpha = 0.2;
        } else {
          ctx.globalAlpha = 0.1;
        }
        // Lower the alpha to give a "preview" effect
        ctx.fill();
        ctx.globalAlpha = 0.3; // Reset alpha for subsequent drawing
      }

      ctx.stroke();

      if (points.length > 2) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const distance = calculateDistance(lastPoint, firstPoint);
        if (distance < SOME_THRESHOLD) {
          ctx.closePath(); // If the polygon is about to be completed, close the path
        }
      }
    }

    // Draw small circles on each point (for both completed polygons and current points)
    const drawCircle = (point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    points.forEach(drawCircle);
    completedPolygons.flat().forEach(drawCircle);
  }, [points, completedPolygons, mousePosition]);

  function unkinkCurrentPolygon(points) {
    let currentPolygon = points.map((p) => [p.x, p.y]);
    const firstPoint = points[0];
    currentPolygon.push([firstPoint.x, firstPoint.y]); // Close the polygon

    const poly = polygon([currentPolygon]);
    const unkinkedResult = unkinkPolygon(poly);

    // Sort all the resulting polygons by area in descending order
    const sortedPolygons = unkinkedResult.features.sort((a, b) => {
      return area(b) - area(a);
    });

    // Filter out polygons that are completely contained within others
    const finalPolygons = sortedPolygons.filter((poly, index, array) => {
      for (let i = 0; i < array.length; i++) {
        if (i !== index && booleanWithin(poly, array[i])) {
          return false; // Current polygon is completely inside another polygon
        }
      }
      return true; // Keep the polygon
    });

    // Map the coordinates back to the expected format
    return finalPolygons.map((polygon) =>
      polygon.geometry.coordinates[0].slice(0, -1).map((coord) => ({
        x: coord[0],
        y: coord[1],
      }))
    );
  }

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
  }, []);

  const attemptToClosePolygon = useCallback(() => {
    const originalPoints = [...points];
    const newPolygons = unkinkCurrentPolygon(points);

    newPolygons.forEach((newPoints) => {
      if (newPoints.length > 2) {
        if (JSON.stringify(originalPoints) !== JSON.stringify(newPoints)) {
          showSnackbar("Polygon was unkinked!", "info");
        }

        setCompletedPolygons((prevPolygons) => [newPoints, ...prevPolygons]);
        setPoints([]);
      }
    });
  }, [points]);

  const handleMouseDown = useCallback(
    (event) => {
      setIsMousePressed(true);
      const x = event.offsetX;
      const y = event.offsetY;

      const firstPoint = points[0];
      const distance =
        points.length > 2 ? calculateDistance({ x, y }, firstPoint) : Infinity;

      if (distance < SOME_THRESHOLD) {
        attemptToClosePolygon();
        return;
      }

      if (pointExistsAtPosition(points, x, y)) {
        return; // Prevent adding a duplicate point
      }
      setPoints((prevPoints) => [...prevPoints, { x, y }]);
    },
    [points]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
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
    </>
  );
}

export default Polygon;
