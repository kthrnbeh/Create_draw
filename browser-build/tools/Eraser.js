export function eraseSegment(context, start, end, size, soft) {
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = soft ? 0.6 : 1;
    context.lineWidth = size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#000";
    context.shadowColor = soft ? "rgba(0, 0, 0, 0.65)" : "transparent";
    context.shadowBlur = soft ? size * 0.35 : 0;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
        ? start.x + 0.01
        : end.x, Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
        ? start.y + 0.01
        : end.y);
    context.stroke();
    context.restore();
}
