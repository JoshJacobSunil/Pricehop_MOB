/**
 * Pricehop Background — Static Textured White
 * Grain texture + subtle dot grid. No cursor interaction.
 */

(function initBackground() {

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = [
    'position:fixed','top:0','left:0',
    'width:100%','height:100%',
    'z-index:-1','pointer-events:none',
  ].join(';');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // ── Grain texture ─────────────────────────────────────────────────────────────
  let grainCanvas;
  function buildGrain() {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = grainCanvas.height = 300;
    const gc = grainCanvas.getContext('2d');
    const id = gc.createImageData(300, 300);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255 | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = Math.random() < 0.3 ? (Math.random() * 16 | 0) : 0;
    }
    gc.putImageData(id, 0, 0);
  }
  buildGrain();

  // ── Draw once ────────────────────────────────────────────────────────────────
  function draw() {
    canvas.width  = W = window.innerWidth;
    canvas.height = H = window.innerHeight;

    // White base
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, W, H);

    // Grain
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (let tx = 0; tx < W; tx += 300)
      for (let ty = 0; ty < H; ty += 300)
        ctx.drawImage(grainCanvas, tx, ty);
    ctx.restore();

    // Subtle dot grid
    ctx.save();
    ctx.fillStyle = 'rgba(165,165,170,0.5)';
    const gap = 28;
    for (let x = gap; x < W; x += gap)
      for (let y = gap; y < H; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.restore();
  }

  draw();

  window.addEventListener('resize', () => { buildGrain(); draw(); });

})();
