export const updateInterpolationNumbers = (boxesForFrame) => {
  // Sort the boxes by class name, then by interpolationNumber
  boxesForFrame.sort((a, b) => {
    if (a.class < b.class) return -1;
    if (a.class > b.class) return 1;
    if (a.interpolate && b.interpolate) {
      return a.interpolationNumber - b.interpolationNumber;
    }
    return a.interpolate ? -1 : 1;
  });

  // Assign interpolationNumber as before
  const uniqueClasses = [...new Set(boxesForFrame.map((box) => box.class))];
  uniqueClasses.forEach((className) => {
    let currentInterpolationNumber = 1;
    for (const box of boxesForFrame) {
      if (box.interpolate && box.class === className) {
        box.interpolationNumber = currentInterpolationNumber;
        currentInterpolationNumber += 1;
      } else if (box.class === className) {
        box.interpolationNumber = null;
      }
    }
  });

  // Assign unique interpolationID based on order
  boxesForFrame.forEach((box, index) => {
    box.interpolationID = index + 1;
  });
};
