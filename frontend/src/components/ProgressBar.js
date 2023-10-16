import React, { useState, useEffect } from "react";
import loading1 from "../assets/images/loading1.svg";
import loading2 from "../assets/images/loading2.svg";
import loading3 from "../assets/images/loading3.svg";
import loading4 from "../assets/images/loading4.svg";

function ProgressBar({ progress }) {
  const extendFrames = (image, repetitions) => Array(repetitions).fill(image);

  const extendedFrames = 8;
  const images = [
    ...extendFrames(loading1, extendedFrames),
    ...extendFrames(loading2, extendedFrames),
    ...extendFrames(loading3, extendedFrames),
    ...extendFrames(loading4, extendedFrames),
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 50);

    console.log(progress);
    return () => {
      clearInterval(progressInterval);
    };
  }, [images]);

  return (
    <div className="loading-screen">
      <svg
        key={progress}
        width="250"
        height="250"
        viewBox="0 0 250 250"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="loadingClip">
            <rect x="0" y="0" width={progress * 2.5} height="250" />
          </clipPath>
        </defs>

        <image
          href={images[currentImageIndex]}
          clipPath="url(#loadingClip)"
          width="250"
          height="250"
        />
      </svg>
    </div>
  );
}

export default ProgressBar;
