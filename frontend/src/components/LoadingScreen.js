import React, { useState, useEffect } from "react";
import loading1 from "../assets/images/loading1.svg";
import loading2 from "../assets/images/loading2.svg";
import loading3 from "../assets/images/loading3.svg";
import loading4 from "../assets/images/loading4.svg";

function LoadingScreen() {
  const images = [loading1, loading2, loading3, loading4];

  console.log("loading");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 200); // Change image every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [images]);

  return (
    <div className="loading-screen">
      <img
        src={images[currentImageIndex]}
        alt="Loading..."
        style={{ width: "25rem", height: "25rem" }}
      />
    </div>
  );
}

export default LoadingScreen;
