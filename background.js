/**
 * Pricehop Background — Interactive Textured White
 * Grain texture + dynamic dot grid. Features fabric bump & origami bunny.
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

  // ── State Management ──────────────────────────────────────────────────────────
  const gap = 28;
  const baseRadius = 0.7;
  
  let mouseX = -1000;
  let mouseY = -1000;
  
  // Entity trailing variables
  let entityX = -1000;
  let entityY = -1000;
  let entityVX = 0;
  let entityVY = 0;
  
  let lastMoveTime = Date.now();
  let state = 'MOVING'; // MOVING, EXPANDING, POPPING_UP, RETRACTING
  
  let holeDot = null;
  let holeTargetRadius = baseRadius;
  let currentHoleRadius = baseRadius;
  
  let bunnyPopProgress = 0; // 0 to 1
  let bunnyTargetProgress = 0;

  let pathQueue = [];
  let currentTarget = null;
  
  let velocity = 0;
  const SPEED_LIMIT = 1.2; // Lowered threshold so it triggers earlier
  let lastMouseX = -1000;
  let lastMouseY = -1000;
  let lastMoveTimeEvent = Date.now();

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    const dt = now - lastMoveTimeEvent;
    
    if (dt > 0 && lastMouseX !== -1000) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      velocity = Math.sqrt(dx*dx + dy*dy) / dt;
    }
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMoveTimeEvent = now;

    // Do not queue points if inside an exclusion zone
    if (velocity <= SPEED_LIMIT && !window.isExclusionZoneHovered) {
      pathQueue.push({x: e.clientX, y: e.clientY});
    }

    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMoveTime = now;
    
    if (state === 'POPPING_UP' || state === 'EXPANDING') {
      state = 'RETRACTING';
      holeTargetRadius = baseRadius;
      bunnyTargetProgress = 0;
    }
  });

  // ── Procedural Bunny Rendering ───────────────────────────────────────────────
  function drawBunny(ctx, x, y, scale, progress) {
    if (progress <= 0.01) return;
    
    ctx.save();
    // Clip to the hole so bunny doesn't render outside the black circle
    ctx.beginPath();
    ctx.arc(x, y, currentHoleRadius, 0, Math.PI * 2);
    ctx.clip();
    
    // Transform
    ctx.translate(x, y + 100 - (progress * 110)); // Slide up
    ctx.scale(scale, scale);
    
    // Draw polygon helper
    const poly = (pts, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i+1]);
      ctx.closePath();
      ctx.fill();
    };

    // Origami Shapes (centered around 0,0)
    // Left Ear
    poly([-20, -30, -10, -70, 0, -30], '#ffffff');
    poly([-10, -70, -15, -35, -5, -35], '#ffcccc'); // Inner pink
    // Right Ear
    poly([20, -30, 10, -70, 0, -30], '#f0f0f0');
    poly([10, -70, 5, -35, 15, -35], '#ffe0e0'); // Inner pink
    // Head left
    poly([0, 10, -30, -30, 0, -30], '#ffffff');
    // Head right
    poly([0, 10, 30, -30, 0, -30], '#e0e0e0');
    // Nose/Mouth area
    poly([-10, 5, 10, 5, 0, 20], '#d0d0d0');
    // Body left
    poly([-30, 20, -50, 70, 0, 80, 0, 10], '#ffffff');
    // Body right
    poly([30, 20, 50, 70, 0, 80, 0, 10], '#f0f0f0');
    
    ctx.restore();
  }

  // ── Main Animation Loop ──────────────────────────────────────────────────────
  let activeBumpRadius = 127.5; // Animated ripple radius

  function draw() {
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime;

    if (entityX === -1000) {
      entityX = mouseX;
      entityY = mouseY;
    } else {
      if (window.isExclusionZoneHovered) {
        // Exclusion zone hover: Skid to a complete stop
        pathQueue = [];
        currentTarget = null;
        entityVX *= 0.85;
        entityVY *= 0.85;
        entityX += entityVX;
        entityY += entityVY;
        
        // Suppress ripple
        activeBumpRadius += (0 - activeBumpRadius) * 0.1;
      } else {
        // Resume ripple
        activeBumpRadius += (127.5 - activeBumpRadius) * 0.1;

        if (velocity > SPEED_LIMIT && timeSinceLastMove < 50) {
          // High speed and actively moving: slowly slide to a stop
          pathQueue = []; // clear any lingering points
          currentTarget = null;
          entityVX *= 0.92; // less friction = slides slower and further
          entityVY *= 0.92;
          
          entityX += entityVX;
          entityY += entityVY;
        } else {
          // Obtain a target from the queue if we don't have one
          if (!currentTarget && pathQueue.length > 0) {
            currentTarget = pathQueue.shift();
          }

          if (currentTarget) {
            let dx = currentTarget.x - entityX;
            let dy = currentTarget.y - entityY;
            let dist = Math.sqrt(dx*dx + dy*dy);

            // If we are close to the target, consume the next points to trace smoothly
            while (dist < 20 && pathQueue.length > 0) {
              currentTarget = pathQueue.shift();
              dx = currentTarget.x - entityX;
              dy = currentTarget.y - entityY;
              dist = Math.sqrt(dx*dx + dy*dy);
            }

            if (dist < 20 && pathQueue.length === 0) {
              currentTarget = null; // Reached the end of the queued path
            } else {
              // Constant robotic path-tracing speed
              const CONSTANT_SPEED = 10;
              entityVX = (dx / dist) * CONSTANT_SPEED;
              entityVY = (dy / dist) * CONSTANT_SPEED;
              
              entityX += entityVX;
              entityY += entityVY;
            }
          } else {
            // Queue is empty. Direct robotic relocation to mouse resting point
            let dx = mouseX - entityX;
            let dy = mouseY - entityY;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 5) {
              const CONSTANT_SPEED = 10;
              entityVX = (dx / dist) * CONSTANT_SPEED;
              entityVY = (dy / dist) * CONSTANT_SPEED;
              entityX += entityVX;
              entityY += entityVY;
            } else {
              entityX = mouseX;
              entityY = mouseY;
              entityVX = 0;
              entityVY = 0;
            }
          }
        }
      }
    }

    // State Logic
    if (state === 'MOVING' || state === 'RETRACTING') {
      // Prevent idle popup if hovering an exclusion zone
      if (now - lastMoveTime > 2000 && mouseX !== -1000 && !window.isExclusionZoneHovered) {
        state = 'EXPANDING';
        
        // Find nearest grid dot to lock onto
        const nx = Math.round(entityX / gap) * gap;
        const ny = Math.round(entityY / gap) * gap;
        holeDot = { x: nx, y: ny };
        holeTargetRadius = 100; // max radius for hole
      }
    }
    
    // Animate hole radius
    currentHoleRadius += (holeTargetRadius - currentHoleRadius) * 0.08;
    
    // Transition to popping up when hole is wide enough
    if (state === 'EXPANDING' && currentHoleRadius > 80) {
      state = 'POPPING_UP';
      bunnyTargetProgress = 1;
    }
    
    // Transition back to moving when fully retracted
    if (state === 'RETRACTING' && currentHoleRadius < baseRadius + 1) {
      state = 'MOVING';
      holeDot = null;
    }

    // Animate bunny progress
    bunnyPopProgress += (bunnyTargetProgress - bunnyPopProgress) * 0.1;

    // Clear canvas
    canvas.width = W; // also clears
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, W, H);

    // Grain
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (let tx = 0; tx < W; tx += 300) {
      for (let ty = 0; ty < H; ty += 300) {
        ctx.drawImage(grainCanvas, tx, ty);
      }
    }
    ctx.restore();

    const maxDistortion = 25;

    // Draw Dot Grid
    ctx.save();
    
    for (let x = gap; x < W + gap; x += gap) {
      for (let y = gap; y < H + gap; y += gap) {
        let drawX = x;
        let drawY = y;
        let radius = baseRadius;
        let isHole = false;
        
        // Hole Logic
        if (holeDot && Math.abs(x - holeDot.x) < 1 && Math.abs(y - holeDot.y) < 1) {
          radius = currentHoleRadius;
          isHole = true;
          ctx.fillStyle = '#111'; // Dark void
        } else {
          ctx.fillStyle = 'rgba(165,165,170,0.5)';
          
          // If a hole exists, push dots away
          if (holeDot && currentHoleRadius > baseRadius) {
            const dx = x - holeDot.x;
            const dy = y - holeDot.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < currentHoleRadius + 30 && dist > 0) {
              const pushForce = (currentHoleRadius + 30 - dist) / 30;
              drawX += (dx / dist) * pushForce * 30;
              drawY += (dy / dist) * pushForce * 30;
            }
          }
          
          // Fabric Bump Logic (Chase cursor)
          const bdx = x - entityX;
          const bdy = y - entityY;
          const bDist = Math.sqrt(bdx*bdx + bdy*bdy);
          
          if (bDist < activeBumpRadius && activeBumpRadius > 1) {
            // Distort outwards slightly
            const force = (activeBumpRadius - bDist) / activeBumpRadius;
            drawX += (bdx / bDist) * force * maxDistortion;
            drawY += (bdy / bDist) * force * maxDistortion;
            radius = baseRadius + (force * 1.5); // scale up slightly on bump
          }
        }
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    
    // Draw Bunny
    if (holeDot) {
      drawBunny(ctx, holeDot.x, holeDot.y, 1.0, bunnyPopProgress);
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  window.addEventListener('resize', () => { 
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrain(); 
  });

})();
