export function drawPath(
  ctx: CanvasRenderingContext2D,
  d: string
): void {
  const tokens = tokenizePath(d);
  let i = 0;
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand: string | null = null;

  function getAbsolute(x: number, y: number, relative: boolean): [number, number] {
    return relative ? [currentX + x, currentY + y] : [x, y];
  }

  while (i < tokens.length) {
    const token = tokens[i];
    const isRelative = token === token.toLowerCase();
    const cmd = token.toUpperCase();

    switch (cmd) {
      case "M": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        [currentX, currentY] = getAbsolute(x, y, isRelative);
        ctx.moveTo(currentX, currentY);
        startX = currentX;
        startY = currentY;
        // Subsequent coordinates after M are treated as L
        lastCommand = "M";
        break;
      }
      case "L": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        [currentX, currentY] = getAbsolute(x, y, isRelative);
        ctx.lineTo(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "H": {
        const x = Number(tokens[++i]);
        currentX = isRelative ? currentX + x : x;
        ctx.lineTo(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "V": {
        const y = Number(tokens[++i]);
        currentY = isRelative ? currentY + y : y;
        ctx.lineTo(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "C": {
        const x1 = Number(tokens[++i]);
        const y1 = Number(tokens[++i]);
        const x2 = Number(tokens[++i]);
        const y2 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        const [ax1, ay1] = getAbsolute(x1, y1, isRelative);
        const [ax2, ay2] = getAbsolute(x2, y2, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        ctx.bezierCurveTo(ax1, ay1, ax2, ay2, ax, ay);
        lastControlX = ax2;
        lastControlY = ay2;
        currentX = ax;
        currentY = ay;
        lastCommand = "C";
        break;
      }
      case "S": {
        const x2 = Number(tokens[++i]);
        const y2 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        let ax1 = currentX;
        let ay1 = currentY;
        if (lastCommand === "C" || lastCommand === "S") {
          ax1 = currentX + (currentX - lastControlX);
          ay1 = currentY + (currentY - lastControlY);
        }
        const [ax2, ay2] = getAbsolute(x2, y2, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        ctx.bezierCurveTo(ax1, ay1, ax2, ay2, ax, ay);
        lastControlX = ax2;
        lastControlY = ay2;
        currentX = ax;
        currentY = ay;
        lastCommand = "S";
        break;
      }
      case "Q": {
        const x1 = Number(tokens[++i]);
        const y1 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        const [ax1, ay1] = getAbsolute(x1, y1, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        ctx.quadraticCurveTo(ax1, ay1, ax, ay);
        lastControlX = ax1;
        lastControlY = ay1;
        currentX = ax;
        currentY = ay;
        lastCommand = "Q";
        break;
      }
      case "T": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        let ax1 = currentX;
        let ay1 = currentY;
        if (lastCommand === "Q" || lastCommand === "T") {
          ax1 = currentX + (currentX - lastControlX);
          ay1 = currentY + (currentY - lastControlY);
        }
        const [ax, ay] = getAbsolute(x, y, isRelative);
        ctx.quadraticCurveTo(ax1, ay1, ax, ay);
        lastControlX = ax1;
        lastControlY = ay1;
        currentX = ax;
        currentY = ay;
        lastCommand = "T";
        break;
      }
      case "Z": {
        ctx.closePath();
        currentX = startX;
        currentY = startY;
        lastCommand = "Z";
        break;
      }
      default:
        // Skip unknown tokens
        break;
    }
    i++;
  }
}

function tokenizePath(d: string): string[] {
  // Split by commands and numbers, preserving signs
  const regex = /([MmLlHhVvCcSsQqTtZz])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(d)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) tokens.push(match[2]);
  }
  return tokens;
}

export function pathToPoints(
  d: string,
  samples = 64
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const tokens = tokenizePath(d);
  let i = 0;
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand: string | null = null;

  function getAbsolute(x: number, y: number, relative: boolean): [number, number] {
    return relative ? [currentX + x, currentY + y] : [x, y];
  }

  function addPoint(x: number, y: number) {
    points.push({ x, y });
  }

  while (i < tokens.length) {
    const token = tokens[i];
    const isRelative = token === token.toLowerCase();
    const cmd = token.toUpperCase();

    switch (cmd) {
      case "M": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        [currentX, currentY] = getAbsolute(x, y, isRelative);
        addPoint(currentX, currentY);
        startX = currentX;
        startY = currentY;
        lastCommand = "M";
        break;
      }
      case "L": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        [currentX, currentY] = getAbsolute(x, y, isRelative);
        addPoint(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "H": {
        const x = Number(tokens[++i]);
        currentX = isRelative ? currentX + x : x;
        addPoint(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "V": {
        const y = Number(tokens[++i]);
        currentY = isRelative ? currentY + y : y;
        addPoint(currentX, currentY);
        lastCommand = "L";
        break;
      }
      case "C": {
        const x1 = Number(tokens[++i]);
        const y1 = Number(tokens[++i]);
        const x2 = Number(tokens[++i]);
        const y2 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        const [ax1, ay1] = getAbsolute(x1, y1, isRelative);
        const [ax2, ay2] = getAbsolute(x2, y2, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        for (let t = 1; t <= samples; t++) {
          const tt = t / samples;
          const u = 1 - tt;
          const uu = u * u;
          const uuu = uu * u;
          const tt2 = tt * tt;
          const ttt = tt2 * tt;
          const px = uuu * currentX + 3 * uu * tt * ax1 + 3 * u * tt2 * ax2 + ttt * ax;
          const py = uuu * currentY + 3 * uu * tt * ay1 + 3 * u * tt2 * ay2 + ttt * ay;
          addPoint(px, py);
        }
        lastControlX = ax2;
        lastControlY = ay2;
        currentX = ax;
        currentY = ay;
        lastCommand = "C";
        break;
      }
      case "S": {
        const x2 = Number(tokens[++i]);
        const y2 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        let ax1 = currentX;
        let ay1 = currentY;
        if (lastCommand === "C" || lastCommand === "S") {
          ax1 = currentX + (currentX - lastControlX);
          ay1 = currentY + (currentY - lastControlY);
        }
        const [ax2, ay2] = getAbsolute(x2, y2, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        for (let t = 1; t <= samples; t++) {
          const tt = t / samples;
          const u = 1 - tt;
          const uu = u * u;
          const uuu = uu * u;
          const tt2 = tt * tt;
          const ttt = tt2 * tt;
          const px = uuu * currentX + 3 * uu * tt * ax1 + 3 * u * tt2 * ax2 + ttt * ax;
          const py = uuu * currentY + 3 * uu * tt * ay1 + 3 * u * tt2 * ay2 + ttt * ay;
          addPoint(px, py);
        }
        lastControlX = ax2;
        lastControlY = ay2;
        currentX = ax;
        currentY = ay;
        lastCommand = "S";
        break;
      }
      case "Q": {
        const x1 = Number(tokens[++i]);
        const y1 = Number(tokens[++i]);
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        const [ax1, ay1] = getAbsolute(x1, y1, isRelative);
        const [ax, ay] = getAbsolute(x, y, isRelative);
        for (let t = 1; t <= samples; t++) {
          const tt = t / samples;
          const u = 1 - tt;
          const px = u * u * currentX + 2 * u * tt * ax1 + tt * tt * ax;
          const py = u * u * currentY + 2 * u * tt * ay1 + tt * tt * ay;
          addPoint(px, py);
        }
        lastControlX = ax1;
        lastControlY = ay1;
        currentX = ax;
        currentY = ay;
        lastCommand = "Q";
        break;
      }
      case "T": {
        const x = Number(tokens[++i]);
        const y = Number(tokens[++i]);
        let ax1 = currentX;
        let ay1 = currentY;
        if (lastCommand === "Q" || lastCommand === "T") {
          ax1 = currentX + (currentX - lastControlX);
          ay1 = currentY + (currentY - lastControlY);
        }
        const [ax, ay] = getAbsolute(x, y, isRelative);
        for (let t = 1; t <= samples; t++) {
          const tt = t / samples;
          const u = 1 - tt;
          const px = u * u * currentX + 2 * u * tt * ax1 + tt * tt * ax;
          const py = u * u * currentY + 2 * u * tt * ay1 + tt * tt * ay;
          addPoint(px, py);
        }
        lastControlX = ax1;
        lastControlY = ay1;
        currentX = ax;
        currentY = ay;
        lastCommand = "T";
        break;
      }
      case "Z": {
        currentX = startX;
        currentY = startY;
        addPoint(currentX, currentY);
        lastCommand = "Z";
        break;
      }
      default:
        break;
    }
    i++;
  }
  return points;
}