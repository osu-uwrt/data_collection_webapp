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

function convertPointsToCoordinates(points) {
  const coordinates = points.map((p) => [p.x, p.y]);
  return coordinates;
}

function useShiftKeyPress() {
  const [isShiftDown, setIsShiftDown] = useState(false);

  useEffect(() => {
    const handleKeyEvent = (event) => {
      if (event.key === "Shift") {
        setIsShiftDown(event.type === "keydown");
      }
    };

    document.addEventListener("keydown", handleKeyEvent);
    document.addEventListener("keyup", handleKeyEvent);

    return () => {
      document.removeEventListener("keydown", handleKeyEvent);
      document.removeEventListener("keyup", handleKeyEvent);
    };
  }, []);

  return isShiftDown;
}
function Polygon({ polygonClasses }) {
  const [mousePosition, setMousePosition] = useState(null);
  const isShiftDown = useShiftKeyPress();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [hoveringOverFirstPoint, setHoveringOverFirstPoint] = useState(false);
  const isDrawingEnabled = true;
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [completedPolygons, setCompletedPolygons] = useState([]);
  const [movingPoint, setMovingPoint] = useState(null);

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

  useEffect(() => {
    console.log("A", completedPolygons);
    console.log("B", polygonClasses["class1"]);
  }, [completedPolygons]);

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
        isDrawingEnabled &&
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
      if (movingPoint && !isDrawingEnabled) {
        const newCompletedPolygons = [...completedPolygons];
        newCompletedPolygons[movingPoint.polygonIndex].points[
          movingPoint.pointIndex
        ] = { x, y };
        setCompletedPolygons(newCompletedPolygons);
      }
    },
    [isDrawingEnabled, isMousePressed, points, movingPoint, completedPolygons]
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
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.lineWidth = 2;

    // Draw completed polygons
    completedPolygons
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((polygon) => {
        if (polygon.visible) {
          const polygonClass = polygon.class || "default";
          const { strokeColor } = polygonClasses[polygonClass] || {};

          ctx.strokeStyle = strokeColor || "white";
          ctx.fillStyle = strokeColor || "white";
          ctx.globalAlpha = 0.3;

          ctx.beginPath();
          ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
          polygon.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.fill();

          // Draw circles in specific color
          ctx.fillStyle = strokeColor || "white";
          ctx.globalAlpha = 0.75;
          polygon.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

    // Draw in-progress polygon (if any points are present)
    if (points.length) {
      ctx.strokeStyle = "white";
      ctx.fillStyle = "white";
      ctx.globalAlpha = 0.3;

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
        ctx.fill();
      }

      ctx.globalAlpha = 0.3; // Reset alpha for stroke to match completed polygons
      ctx.stroke();

      if (points.length > 2) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const distance = calculateDistance(lastPoint, firstPoint);
        if (distance < SOME_THRESHOLD) {
          ctx.closePath(); // If the polygon is about to be completed, close the path
        }
      }

      // Draw circles in white for in-progress polygon
      ctx.globalAlpha = 0.75;
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [points, completedPolygons, mousePosition, polygonClasses]);

  function unkinkCurrentPolygon(points) {
    let currentPolygon = convertPointsToCoordinates(points);
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
    if (movingPoint) {
      setMovingPoint(null);
    }
  }, [movingPoint]);

  const attemptToClosePolygon = useCallback(() => {
    const originalPoints = [...points];
    const newPolygons = unkinkCurrentPolygon(points);

    newPolygons.forEach((newPoints) => {
      if (newPoints.length > 2) {
        if (JSON.stringify(originalPoints) !== JSON.stringify(newPoints)) {
          showSnackbar("Polygon was unkinked!", "info");
        }

        setCompletedPolygons((prevPolygons) => [
          {
            points: newPoints,
            class: "class1",
            displayOrder: prevPolygons.length,
            visible: true,
          },
          ...prevPolygons,
        ]);
        setPoints([]);
      }
    });
  }, [points]);

  const handleDrawingMouseDown = useCallback(
    (x, y) => {
      const firstPoint = points[0];
      const distance =
        points.length > 2 ? calculateDistance({ x, y }, firstPoint) : Infinity;

      if (distance < SOME_THRESHOLD) {
        attemptToClosePolygon();
        return;
      }

      if (!pointExistsAtPosition(points, x, y)) {
        setPoints((prevPoints) => [...prevPoints, { x, y }]);
      }
    },
    [points, attemptToClosePolygon]
  );

  const findPointNearMouse = useCallback(
    (x, y) => {
      for (const polygon of completedPolygons) {
        for (const [index, point] of polygon.entries()) {
          if (calculateDistance(point, { x, y }) < SOME_THRESHOLD) {
            return {
              polygonIndex: completedPolygons.indexOf(polygon),
              pointIndex: index,
            };
          }
        }
      }
      return null;
    },
    [completedPolygons]
  );
  const handleMouseDown = useCallback(
    async (event) => {
      setIsMousePressed(true);
      const x = event.offsetX;
      const y = event.offsetY;

      if (event.button === 2) {
        event.preventDefault();
        setPoints((prevPoints) => prevPoints.slice(0, -1));
        return;
      }

      if (isDrawingEnabled) {
        handleDrawingMouseDown(x, y);
      } else {
        const pointToMove = findPointNearMouse(x, y);
        if (pointToMove) {
          setMovingPoint(pointToMove);
        }
      }
    },
    [isDrawingEnabled, handleDrawingMouseDown, findPointNearMouse]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("contextmenu", (e) => e.preventDefault());
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleDrawingMouseDown]);

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
