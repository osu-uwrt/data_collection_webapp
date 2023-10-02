import React from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';

const BoundingBox = ({ box, index, isDraggable, updateBoundingBox, videoWidth, videoHeight }) => (
    <Draggable
        key={`draggable-${index}`}
        bounds="parent"
        position={{ x: box.left, y: box.top }}
        disabled={!isDraggable}
        onStop={(e, data) => {
            updateBoundingBox(index, { left: data.x, top: data.y });
        }}
    >
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <ResizableBox
                width={box.width}
                height={box.height}
                minConstraints={[10, 10]}
                maxConstraints={[videoWidth - box.left, videoHeight - box.top]}
                onResizeStart={(e) => {
                    e.stopPropagation();
                }}
                onResizeStop={(e, data) => {
                    e.stopPropagation();
                    updateBoundingBox(index, { width: data.size.width, height: data.size.height });
                }}
            >
                <div 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: '2px solid red'
                    }}
                />
            </ResizableBox>
        </div>
    </Draggable>
);

export default BoundingBox;
