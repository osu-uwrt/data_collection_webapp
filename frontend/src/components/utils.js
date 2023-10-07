export const updateInterpolationNumbers = (boxesForFrame) => {
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
};
