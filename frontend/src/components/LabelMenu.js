import React from "react";

function LabelMenu({ boxes, updateBoxClass }) {
  return (
    <div className="label-menu">
      <h3>Current Bounding Boxes</h3>
      <ul>
        {boxes.map((box, index) => (
          <li key={index}>
            Box {index + 1}
            <select
              value={box.class}
              onChange={(e) => updateBoxClass(index, e.target.value)}
            >
              {/* Assuming these are the classes you might have, but adjust as necessary */}
              <option value="Pedestrian">Pedestrian</option>
              <option value="Car">Car</option>
              {/* Add more classes as necessary */}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LabelMenu;
