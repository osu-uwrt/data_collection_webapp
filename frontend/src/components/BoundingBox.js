import React from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';

export default function BoundingBox({ box, onUpdate, onRemove }) {
  return (
    <Draggable
      defaultPosition={{ x: box.x, y: box.y }}
      onStop={(e, data) => {
        onUpdate({
          ...box,
          x: data.x,
          y: data.y,
        });
      }}
    >
      <Resizable
        size={{ width: box.width, height: box.height }}
        onResizeStop={(e, direction, ref) => {
          onUpdate({
            ...box,
            width: ref.offsetWidth,
            height: ref.offsetHeight
          });
        }}
      >
        <div className="boundingBox" onDoubleClick={onRemove}/>
      </Resizable>
    </Draggable>
  );
}
