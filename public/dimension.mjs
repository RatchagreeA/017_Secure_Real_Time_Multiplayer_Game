const canvasWidth = 640;
const canvasHeight = 480;
const border = 5;

const dimension = {
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight,
  arenaSizeX: canvasWidth - 2 * border,
  arenaSizeY: canvasHeight - 2 * border,
  minX: 0,
  minY: 40,
  maxX: canvasWidth,
  maxY: canvasHeight,
};
try {
  module.exports = dimension;
} catch (e) {}

export default dimension;
