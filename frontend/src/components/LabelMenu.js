import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const LabelMenu = ({
  boundingBoxes,
  currentFrame,
  onClassChange,
  onDelete,
}) => {
  const classColors = {
    class1: "cyan",
    class2: "limegreen",
    class3: "yellow",
  };

  const handleClassChange = (index, newClass) => {
    onClassChange(index, newClass, classColors[newClass] || "white");
  };
  const boxesForCurrentFrame = boundingBoxes[currentFrame] || [];

  return (
    <div className="label-menu">
      <Typography variant="h6" gutterBottom>
        Bounding Boxes
      </Typography>
      <List>
        {boxesForCurrentFrame.map((box, index) => (
          <ListItem key={index} dense divider className="label-menu-item">
            <ListItemText primary={`Box ${index + 1}`} />
            <Select
              value={box.class}
              onChange={(e) => handleClassChange(index, e.target.value)}
              variant="outlined"
              size="small"
              className="label-menu-select"
            >
              {/* Here you can list your possible classes for the bounding box */}
              <MenuItem value="class1">Class 1</MenuItem>
              <MenuItem value="class2">Class 2</MenuItem>
              <MenuItem value="class3">Class 3</MenuItem>
              {/* Add more classes as needed */}
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
