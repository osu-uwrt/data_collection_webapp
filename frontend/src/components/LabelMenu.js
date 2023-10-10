import React from "react";
import { List, ListItem, Select, MenuItem, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const LabelMenu = ({
  boundingBoxes,
  currentFrame,
  onClassChange,
  onDelete,
  boxClasses,
  setBoxClasses,
  onToggleInterpolation,
  onChangeDisplayOrder,
}) => {
  const handleClassChange = (index, newClass) => {
    onClassChange(index, newClass);
  };

  const handleColorChange = (e, index) => {
    const newColor = e.target.value;
    const currentClass = boundingBoxes[currentFrame][index].class;

    setBoxClasses((prev) => ({
      ...prev,
      [currentClass]: {
        ...prev[currentClass],
        strokeColor: newColor,
      },
    }));

    onClassChange(index, currentClass, newColor);
  };

  const toggleInterpolation = (index) => {
    onToggleInterpolation(currentFrame, index);
  };

  const boxesForCurrentFrame = boundingBoxes[currentFrame] || [];

  const handleDragStart = (e, displayOrder) => {
    e.dataTransfer.setData("text/plain", displayOrder);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const middle = (rect.top + rect.bottom) / 2;

    if (e.clientY < middle) {
      e.currentTarget.style.borderTop = "2px solid red";
      e.currentTarget.style.borderBottom = "none";
    } else {
      e.currentTarget.style.borderTop = "none";
      e.currentTarget.style.borderBottom = "2px solid red";
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.borderTop = "none";
    e.currentTarget.style.borderBottom = "none";
  };

  const handleDrop = (e, displayOrder) => {
    e.preventDefault();

    const isDropBelow = e.currentTarget.style.borderBottom === "2px solid red";

    e.currentTarget.style.borderTop = "none";
    e.currentTarget.style.borderBottom = "none";

    const draggedItemDisplayOrder = +e.dataTransfer.getData("text/plain");
    if (draggedItemDisplayOrder !== displayOrder) {
      if (isDropBelow && draggedItemDisplayOrder < displayOrder) {
        displayOrder += 1;
      }
      onChangeDisplayOrder(draggedItemDisplayOrder, displayOrder);
    }
  };

  return (
    <div className="label-menu">
      <Typography variant="h6" gutterBottom>
        Bounding Boxes
      </Typography>
      <List>
        {boxesForCurrentFrame.map((box, index) => (
          <ListItem
            key={box.displayOrder}
            draggable
            onDragStart={(e) => handleDragStart(e, box.displayOrder)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={(e) => handleDragLeave(e)}
            onDrop={(e) => handleDrop(e, box.displayOrder)}
            dense
            divider
            className="label-menu-item"
          >
            {box.interpolationNumber && (
              <div className="interpolation-id">{box.interpolationNumber}</div>
            )}
            <div
              style={{
                height: "80%",
                width: "10px",
                backgroundColor: box.interpolate
                  ? "var(--ui-button-active)"
                  : "gray",
                marginRight: "8px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={() => toggleInterpolation(index)}
            />
            <div
              style={{
                height: "100%",
                width: "10px",
                backgroundColor: boxClasses[box.class]?.strokeColor || "gray",
                marginRight: "8px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement("input");
                input.type = "color";
                input.value = boxClasses[box.class]?.strokeColor || "gray";
                input.onchange = (e) => handleColorChange(e, index);
                input.click();
              }}
            />
            <Select
              value={box.class}
              onChange={(e) => handleClassChange(index, e.target.value)}
              variant="outlined"
              size="small"
              className="label-menu-select large-select"
            >
              {Object.keys(boxClasses).map((boxClass) => (
                <MenuItem key={boxClass} value={boxClass}>
                  {boxClass.charAt(0).toUpperCase() + boxClass.slice(1)}
                </MenuItem>
              ))}
            </Select>
            <button
              className="icon-button"
              onClick={() => onDelete(index)}
              title="Delete Box"
            >
              <DeleteIcon />
            </button>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default LabelMenu;
