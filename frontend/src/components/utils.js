export const updateInterpolationNumbers = (boxesForFrame) => {
  if (!boxesForFrame) {
    console.warn(
      "updateInterpolationNumbers received undefined boxesForFrame."
    );
    return;
  }
  const interpolationBoxes = boxesForFrame
    .filter((box) => box.interpolate)
    .sort((a, b) => {
      if (a.class < b.class) return -1;
      if (a.class > b.class) return 1;
      return 0;
    });

  let currentInterpolationID = 1;
  let currentInterpolationNumber = 1;
  let previousClass = null;

  for (const box of interpolationBoxes) {
    if (box.class !== previousClass) {
      // Reset the counter for a new class
      currentInterpolationNumber = 1;
    }

    box.interpolationNumber = currentInterpolationNumber;
    box.interpolationID = currentInterpolationID; // Unique ID

    currentInterpolationNumber += 1;
    currentInterpolationID += 1;
    previousClass = box.class;
  }

  for (const box of boxesForFrame) {
    if (!box.interpolate) {
      box.interpolationNumber = null;
    }
  }
};
