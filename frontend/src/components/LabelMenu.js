import React from "react";
import { List, ListItem, Select, MenuItem, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CircleIcon from "@mui/icons-material/Circle";

const LabelMenu = ({
  boundingBoxes,
  currentFrame,
  onClassChange,
  onDelete,
  boxClasses,
  setBoxClasses,
  onToggleInterpolation,
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

  // Sort boxes by displayOrder before mapping
  const boxesForCurrentFrame = (boundingBoxes[currentFrame] || []).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className="label-menu">
      <Typography variant="h6" gutterBottom>
        Bounding Boxes
      </Typography>
      <List>
        {boxesForCurrentFrame.map((box, index) => (
          <ListItem key={index} dense divider className="label-menu-item">
            <CircleIcon
              style={{
                color: box.interpolate ? "var(--ui-button-active)" : "gray",
                marginRight: "5px",
                fontSize: "7px",
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
