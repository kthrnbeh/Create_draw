export function drawExportContent(context, artwork, background, reference, referenceOpacity) {
    context.save();
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    context.fillStyle = background;
    context.fillRect(0, 0, artwork.width, artwork.height);
    if (reference) {
        const scale = Math.min(artwork.width / reference.naturalWidth, artwork.height / reference.naturalHeight);
        const width = reference.naturalWidth * scale;
        const height = reference.naturalHeight * scale;
        context.globalAlpha = Math.max(0, Math.min(1, referenceOpacity));
        context.drawImage(reference, (artwork.width - width) / 2, (artwork.height - height) / 2, width, height);
        context.globalAlpha = 1;
    }
    context.drawImage(artwork, 0, 0);
    context.restore();
}
