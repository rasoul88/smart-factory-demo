export const SCHEMATIC_WIDTH = 1004;
export const SCHEMATIC_HEIGHT = 620;

export const NODE_WIDTH = 118;
export const NODE_HEIGHT = 88;

interface IPoint {
  x: number;
  y: number;
}

const distance = (a: IPoint, b: IPoint) => Math.hypot(b.x - a.x, b.y - a.y);

const unitFrom = (from: IPoint, to: IPoint): IPoint => {
  const length = distance(from, to) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

export const roundedPolyline = (points: IPoint[], radius = 14): string => {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];

    const towardPrevious = unitFrom(current, previous);
    const towardNext = unitFrom(current, next);

    const trimPrevious = Math.min(radius, distance(previous, current) / 2);
    const trimNext = Math.min(radius, distance(current, next) / 2);

    const start = {
      x: current.x + towardPrevious.x * trimPrevious,
      y: current.y + towardPrevious.y * trimPrevious,
    };
    const end = {
      x: current.x + towardNext.x * trimNext,
      y: current.y + towardNext.y * trimNext,
    };

    path += ` L ${start.x} ${start.y} Q ${current.x} ${current.y} ${end.x} ${end.y}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;

  return path;
};

export interface IPipeGeometry {
  path: string;
  labelX: number;
  labelY: number;
}

export const pipeGeometry = (from: IPoint, to: IPoint): IPipeGeometry => {
  const halfHeight = NODE_HEIGHT / 2;
  const sameRow = Math.abs(from.y - to.y) < 4;

  if (sameRow) {
    const startX =
      from.x > to.x ? from.x - NODE_WIDTH / 2 : from.x + NODE_WIDTH / 2;
    const endX = from.x > to.x ? to.x + NODE_WIDTH / 2 : to.x - NODE_WIDTH / 2;

    return {
      path: roundedPolyline([
        { x: startX, y: from.y },
        { x: endX, y: to.y },
      ]),
      labelX: (startX + endX) / 2,
      labelY: from.y,
    };
  }

  const goingDown = to.y > from.y;
  const startY = goingDown ? from.y + halfHeight : from.y - halfHeight;
  const endY = goingDown ? to.y - halfHeight : to.y + halfHeight;
  const midY = (startY + endY) / 2;

  return {
    path: roundedPolyline([
      { x: from.x, y: startY },
      { x: from.x, y: midY },
      { x: to.x, y: midY },
      { x: to.x, y: endY },
    ]),
    labelX: from.x,
    labelY: midY,
  };
};

export const positionStyle = (point: IPoint) => ({
  left: `${((point.x / SCHEMATIC_WIDTH) * 100).toFixed(3)}%`,
  top: `${((point.y / SCHEMATIC_HEIGHT) * 100).toFixed(3)}%`,
});
