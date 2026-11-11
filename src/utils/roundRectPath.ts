/**
 * Adds a rounded-rectangle subpath to the current canvas path.
 *
 * Replaces CanvasRenderingContext2D.roundRect(), which does not
 * exist in older browsers/WebViews — calling it there throws inside
 * the studios' draw effects and the whole section falls into the
 * error boundary ("This section couldn't load"). This helper only
 * appends to the current path (no beginPath/fill/stroke), so call
 * sites keep their existing beginPath() + fill()/stroke() flow.
 */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}
