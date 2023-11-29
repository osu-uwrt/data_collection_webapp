import React, { useRef, useEffect, useState, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import {
  polygon,
  unkinkPolygon,
  area,
  booleanWithin,
  point,
  booleanPointInPolygon,
} from "@turf/turf";

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
function Polygon({
  videoWidth,
  videoHeight,
  currentFrame,
  framePolygons,
  setFramePolygons,
  polygonClasses,
  showLabels,
  runInterpolation,
  onInterpolationCompleted,
  selected,
  setSelected,
  isDrawingEnabled,
  setIsDrawingEnabled,
}) {
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
  const [movingPoint, setMovingPoint] = useState(null);
  const [previousLength, setPreviousLength] = useState(0);

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
    setSelected(null);
  }, [currentFrame, isDrawingEnabled]);

  useEffect(() => {
    if (isDrawingEnabled) {
      canvasRef.current.style.cursor = "crosshair";
    } else {
      canvasRef.current.style.cursor = "default";
    }
  }, [isDrawingEnabled]);

  useEffect(() => {
    if (runInterpolation) {
      if (validateInterpolation(framePolygons)) {
        performInterpolation(framePolygons);
        resetInterpolationFlags(framePolygons);

        setSnackbarMessage(`Interpolation successful!`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
      }
      if (onInterpolationCompleted) {
        onInterpolationCompleted();
      }
    }
  }, [runInterpolation]);

  const resetInterpolationFlags = (framePolygons) => {
    for (let frame in framePolygons) {
      framePolygons[frame].forEach((box) => {
        box.interpolate = false;
        box.interpolationNumber = null;
        box.interpolationID = null;
      });
    }
  };

  const validateInterpolation = (framePolygons) => {
    let activeInterpolationFrames = [];
    let activeInterpolationSignatures = {};

    for (let frame in framePolygons) {
      const boxes = framePolygons[frame].filter((box) => box.interpolate);
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

  const toggleBoxVisibility = useCallback(() => {
    if (selected !== null) {
      const updatedBoxesForFrame = [...completedPolygons];
      updatedBoxesForFrame[selected].visible =
        !updatedBoxesForFrame[selected].visible;
      setCompletedPolygons(updatedBoxesForFrame);
    }
    updateFramePolygonsWithCurrentFrame();
  }, [selected, completedPolygons]);

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
    let updated = false;
    const newFrameBoxes = { ...framePolygons };

    for (let frame in framePolygons) {
      if (framePolygons[frame] === undefined) {
        newFrameBoxes[frame] = [];
        updated = true;
      }
    }

    if (updated) {
      setFramePolygons(newFrameBoxes);
    }

    if (framePolygons[currentFrame] !== undefined) {
      setCompletedPolygons(framePolygons[currentFrame]);
    } else {
      setCompletedPolygons([]);
    }
  }, [currentFrame, framePolygons]);

  useEffect(() => {
    if (completedPolygons.length < 1) {
      canvasRef.current.style.cursor = "default";
    }
    if (completedPolygons && completedPolygons.length !== previousLength) {
      setSelected(null);
      updateFramePolygonsWithCurrentFrame();
    }

    // Update the ref value
    setPreviousLength(completedPolygons.length);
  }, [currentFrame, completedPolygons, framePolygons]);

  const updateFramePolygonsWithCurrentFrame = () => {
    setFramePolygons((prev) => ({
      ...prev,
      [currentFrame]: completedPolygons,
    }));
  };

  useEffect(() => {}, [completedPolygons]);

  function pairPoints(startPoints, endPoints) {
    let pairs = [];

    function generatePairs() {
      let potentialPairs = [];
      startPoints.forEach((startPoint, startIndex) => {
        endPoints.forEach((endPoint, endIndex) => {
          const distance = Math.hypot(
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y
          );
          potentialPairs.push({ startIndex, endIndex, distance });
        });
      });

      potentialPairs.sort((a, b) => a.distance - b.distance);

      let usedStartIndexes = new Set();
      let usedEndIndexes = new Set();

      potentialPairs.forEach((pair) => {
        if (
          !usedStartIndexes.has(pair.startIndex) &&
          !usedEndIndexes.has(pair.endIndex)
        ) {
          usedStartIndexes.add(pair.startIndex);
          usedEndIndexes.add(pair.endIndex);
          pairs[pair.startIndex] = {
            startIndex: pair.startIndex,
            endIndex: pair.endIndex,
          };
        }
      });

      return { usedStartIndexes, usedEndIndexes };
    }

    let { usedStartIndexes, usedEndIndexes } = generatePairs();

    // Handle orphan points by creating new points on the closest edge of the opposite polygon
    function createPointOnEdge(orphanPoint, polygonPoints) {
      let closestPoint = null;
      let closestDistance = Infinity;
      let closestSegmentIndex = -1;

      // Function to project a point onto a line segment and get the closest point on the segment
      function projectPointOnSegment(px, py, x1, y1, x2, y2) {
        let l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return { x: x1, y: y1 };
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        if (t < 0) return { x: x1, y: y1 };
        if (t > 1) return { x: x2, y: y2 };
        return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
      }

      // Iterate over each edge in the polygon
      for (let i = 0; i < polygonPoints.length; i++) {
        let start = polygonPoints[i];
        let end = polygonPoints[(i + 1) % polygonPoints.length]; // wrap around to first point

        // Find the closest point on the current segment
        let projectedPoint = projectPointOnSegment(
          orphanPoint.x,
          orphanPoint.y,
          start.x,
          start.y,
          end.x,
          end.y
        );

        // Calculate distance from the orphan point to the projected point on the segment
        let distance = Math.hypot(
          projectedPoint.x - orphanPoint.x,
          projectedPoint.y - orphanPoint.y
        );

        // If this is the closest distance so far, save this point and distance
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = projectedPoint;
          closestSegmentIndex = i;
        }
      }

      // Return the closest point on the closest edge
      return { point: closestPoint, insertIndex: closestSegmentIndex + 1 };
    }

    // Handling orphan points
    let orphanHandled = false;

    if (startPoints.length < endPoints.length) {
      endPoints.forEach((point, index) => {
        if (!usedEndIndexes.has(index)) {
          orphanHandled = true;
          const { point: newPoint, insertIndex } = createPointOnEdge(
            point,
            startPoints
          );
          startPoints.splice(insertIndex, 0, newPoint);
        }
      });
    } else if (startPoints.length > endPoints.length) {
      startPoints.forEach((point, index) => {
        if (!usedStartIndexes.has(index)) {
          orphanHandled = true;
          const { point: newPoint, insertIndex } = createPointOnEdge(
            point,
            endPoints
          );
          endPoints.splice(insertIndex, 0, newPoint);
        }
      });
    }

    // Re-pair if orphan points were handled
    if (orphanHandled) {
      pairs = []; // Reset pairs
      generatePairs();
    }

    return pairs;
  }

  const performInterpolation = (framePolygons) => {
    const sortedFrames = Object.keys(framePolygons).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
    let startFrame = null;

    for (let i = 0; i < sortedFrames.length; i++) {
      const frame = sortedFrames[i];
      if (framePolygons[frame].some((polygon) => polygon.interpolate)) {
        if (startFrame === null) {
          startFrame = frame;
        } else {
          const endFrame = frame;

          framePolygons[startFrame].forEach((startPolygon) => {
            if (!startPolygon.interpolate) {
              return;
            }

            const endPolygon = framePolygons[endFrame].find(
              (polygon) =>
                polygon.interpolationID === startPolygon.interpolationID &&
                polygon.interpolate
            );

            if (!endPolygon) {
              return;
            }

            // Pair points
            const pointPairs = pairPoints(
              startPolygon.points,
              endPolygon.points
            );

            for (let j = parseInt(startFrame) + 1; j < endFrame; j++) {
              if (!framePolygons[j]) {
                framePolygons[j] = [];
              }

              const interpolatedPoints = pointPairs.map((pair) => {
                const startPoint = startPolygon.points[pair.startIndex];
                const endPoint = endPolygon.points[pair.endIndex];
                const alpha = (j - startFrame) / (endFrame - startFrame);
                return {
                  x: startPoint.x + alpha * (endPoint.x - startPoint.x),
                  y: startPoint.y + alpha * (endPoint.y - startPoint.y),
                };
              });

              const interpolatedPolygon = {
                points: interpolatedPoints,
                class: startPolygon.class,
                displayOrder: startPolygon.displayOrder,
                visible: startPolygon.visible,
                interpolate: false,
                interpolationNumber: null,
                interpolationID: startPolygon.interpolationID,
              };

              const correctIndex = framePolygons[j].findIndex(
                (polygon) =>
                  polygon.interpolationID ===
                  interpolatedPolygon.interpolationID
              );

              if (correctIndex === -1) {
                framePolygons[j].push(interpolatedPolygon);
              } else {
                framePolygons[j][correctIndex] = interpolatedPolygon;
              }
            }
          });

          startFrame = endFrame;
        }
      }
    }
    return framePolygons;
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
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }
  }, [videoWidth, videoHeight]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.lineWidth = 2;

    const polygonsForRendering = [...(completedPolygons || [])].filter(
      (polygon) => polygon.visible
    );

    const sortedPolygons = polygonsForRendering.sort(
      (a, b) => b.displayOrder - a.displayOrder
    );
    if (isDrawingEnabled) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "white";
    }
    // Draw completed polygons
    sortedPolygons.forEach((polygon, index) => {
      const polygonClass = polygon.class || "default";
      const { strokeColor } = polygonClasses[polygonClass] || {};

      let positionAfterSorting = sortedPolygons.findIndex(
        (b) =>
          completedPolygons[selected] &&
          b.displayOrder === completedPolygons[selected].displayOrder
      );
      const isPolygonSelected = index === positionAfterSorting;

      if (isPolygonSelected && !isDrawingEnabled) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = strokeColor || "white";
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = strokeColor || "white";
      }
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

      if (showLabels && polygon.points.length > 0) {
        // Calculate centroid or other position for the label
        const centroid = polygon.points.reduce(
          (acc, point) => ({
            x: acc.x + point.x / polygon.points.length,
            y: acc.y + point.y / polygon.points.length,
          }),
          { x: 0, y: 0 }
        );

        let label = polygon.class || "default";

        if (polygon.interpolate) {
          label += ` (${polygon.interpolationNumber || "N/A"})`;
        }

        ctx.font = "14px Arial";
        const metrics = ctx.measureText(label);
        const labelWidth = metrics.width + 10;
        const labelHeight = 20;

        // Adjust position as needed
        const labelX = centroid.x - labelWidth / 2;
        const labelY = centroid.y - labelHeight / 2;

        // Render label background
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

        // Render label text
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        ctx.globalAlpha = 1;
        ctx.fillText(label, labelX + 5, labelY + 15);
        ctx.shadowColor = "transparent";
        ctx.globalAlpha = 0.3;
      }
    });

    // Draw in-progress polygon (if any points are present)
    if (points.length) {
      ctx.strokeStyle = "white";
      ctx.fillStyle = "white";

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

      ctx.globalAlpha = 1; // Reset alpha for stroke to match completed polygons
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
  }, [
    points,
    completedPolygons,
    mousePosition,
    polygonClasses,
    showLabels,
    selected,
  ]);

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

        setCompletedPolygons((prevPolygons) => {
          const newDisplayOrder = prevPolygons.length;

          return [
            {
              points: newPoints,
              class: "class1",
              displayOrder: newDisplayOrder,
              visible: true,
              interpolate: null,
              interpolationNumber: null,
              interpolationID: null,
            },
            ...prevPolygons,
          ];
        });

        setPoints([]);
        setIsDrawingEnabled(false);
      }
    });
  }, [points]);

  const handleMouseClick = (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const clickedPoint = point([x, y]);

    let selectedIndex = -1;

    for (let i = 0; i < completedPolygons.length; i++) {
      if (completedPolygons[i].visible) {
        const polygonPoints = convertPointsToCoordinates(
          completedPolygons[i].points
        );

        // Ensure there are at least three vertices
        if (polygonPoints.length < 3) continue;

        // Close the polygon by adding the first point to the end
        const closedPolygonPoints = [...polygonPoints, polygonPoints[0]];

        const currentPolygon = polygon([closedPolygonPoints]);

        if (booleanPointInPolygon(clickedPoint, currentPolygon)) {
          selectedIndex = i;
          break;
        }
      }
    }

    if (selectedIndex !== -1) {
      setSelected(selectedIndex);
    } else {
      setSelected(null); // deselect if no polygon is clicked
    }
  };

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
      for (
        let polygonIndex = 0;
        polygonIndex < completedPolygons.length;
        polygonIndex++
      ) {
        const polygon = completedPolygons[polygonIndex];
        if (polygon.visible) {
          for (
            let pointIndex = 0;
            pointIndex < polygon.points.length;
            pointIndex++
          ) {
            const point = polygon.points[pointIndex];
            if (calculateDistance(point, { x, y }) < SOME_THRESHOLD) {
              return {
                polygonIndex,
                pointIndex,
              };
            }
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
        handleMouseClick(event);
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
        width={videoWidth}
        height={videoHeight}
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
