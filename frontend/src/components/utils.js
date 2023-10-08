export const updateInterpolationNumbers = (boxesForFrame) => {
  const interpolationBoxes = boxesForFrame
    .filter((box) => box.interpolate)
    .sort((a, b) => {
      if (a.class < b.class) return -1;
      if (a.class > b.class) return 1;
      return 0;
    });

  let currentInterpolationNumber = 1;
  for (const box of interpolationBoxes) {
    box.interpolationNumber = currentInterpolationNumber;
    currentInterpolationNumber += 1;
  }

  for (const box of boxesForFrame) {
    if (!box.interpolate) {
      box.interpolationNumber = null;
      box.interpolationID = null;
    }
  }

  interpolationBoxes.forEach((box, index) => {
    box.interpolationID = index + 1;
  });
};
