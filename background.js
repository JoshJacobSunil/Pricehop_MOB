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
  
  let mouseX = W / 2;
  let mouseY = H / 2;
  
  // Continuous smooth trailing bump (glides steadily over ~1.5s with zero initial pause)
  let bumpX = mouseX;
  let bumpY = mouseY;

  let entityX = mouseX;
  let entityY = mouseY;
  
  let lastMoveTime = Date.now();
  let state = 'MOVING'; // MOVING, EXPANDING, POPPING_UP, RETRACTING
  
  let holeDot = null;
  let holeTargetRadius = baseRadius;
  let currentHoleRadius = baseRadius;
  
  let pawPopProgress = 0; // 0 to 1
  let pawTargetProgress = 0;
  let headPopProgress = 0; // 0 to 1
  let headTargetProgress = 0;
  let headPopStartTime = 0;
  let earShakeStartTime = 0;
  let lastBlinkTime = Date.now();
  let isBlinking = false;
  let blinkStartTime = 0;
  let pawRetractStartTime = 0;

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMoveTime = now;

    if (state === 'POPPING_UP' || state === 'EXPANDING') {
      state = 'RETRACTING';
      holeTargetRadius = currentHoleRadius;
      headTargetProgress = 0;
      pawRetractStartTime = Date.now() + 500;
      headPopStartTime = 0;
      earShakeStartTime = 0;
    }
  });

  window.addEventListener('scroll', () => {
    lastMoveTime = Date.now(); // Reset idle timer when scrolling
    
    // Force immediate retraction if scroll starts while bunny is popping/expanded
    if (state === 'POPPING_UP' || state === 'EXPANDING') {
      state = 'RETRACTING';
      holeTargetRadius = currentHoleRadius; 
      headTargetProgress = 0; 
      pawRetractStartTime = Date.now(); // retract immediately (no delay)
      headPopStartTime = 0;
      earShakeStartTime = 0;
    }
  });

  // ── Procedural Bunny Rendering — Minimal Apple-style ─────────────────────────
  function drawBunny(ctx, x, y, scale, pawProgress, headProgress, earAngle) {
    if (pawProgress <= 0.01 && headProgress <= 0.01) return;
    
    // Head logic
    if (headProgress > 0.01) {
      // Bunny origin rests near the bottom edge of the hole when fully popped
      const yOffset = currentHoleRadius + 30 - (headProgress * 60); 
      
      ctx.save();
      // Clip to the hole so bunny body/head doesn't render outside the black circle
      ctx.beginPath();
      ctx.arc(x, y, currentHoleRadius, 0, Math.PI * 2);
      ctx.clip();
      
      // Transform
      ctx.translate(x, y + yOffset);
      ctx.scale(scale * 0.77, scale * 0.77); // Decreased size by 30% from 1.1 (1.1 * 0.7 = 0.77)
      
      // Helper for soft bezier origami shapes
      const shape = (color, drawFn) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = color; // Soften seams to prevent gaps
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        drawFn();
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // --- EARS (realistic spoon shape) ---
      ctx.save();
      ctx.rotate(earAngle); // Shake side-to-side
      // Left Ear
      shape('#ffffff', () => {
        ctx.moveTo(-15, -15);
        ctx.quadraticCurveTo(-45, -30, -40, -80); // Outer left edge
        ctx.quadraticCurveTo(-35, -95, -25, -85); // Soft tip
        ctx.quadraticCurveTo(-10, -50, -5, -20);  // Inner right edge
      });
      // Left Ear Inner Pink
      shape('#ffcccc', () => {
        ctx.moveTo(-15, -25);
        ctx.quadraticCurveTo(-35, -35, -30, -75);
        ctx.quadraticCurveTo(-26, -85, -22, -75);
        ctx.quadraticCurveTo(-10, -45, -8, -25);
      });
      ctx.restore();

      ctx.save();
      ctx.rotate(earAngle); // Shake side-to-side together
      // Right Ear
      shape('#f0f0f0', () => {
        ctx.moveTo(15, -15);
        ctx.quadraticCurveTo(45, -30, 40, -80); 
        ctx.quadraticCurveTo(35, -95, 25, -85); 
        ctx.quadraticCurveTo(10, -50, 5, -20);
      });
      // Right Ear Inner Pink
      shape('#ffe0e0', () => {
        ctx.moveTo(15, -25);
        ctx.quadraticCurveTo(35, -35, 30, -75);
        ctx.quadraticCurveTo(26, -85, 22, -75);
        ctx.quadraticCurveTo(10, -45, 8, -25);
      });
      ctx.restore();

      // --- HEAD (fuller cheeks) ---
      // Head left
      shape('#ffffff', () => {
        ctx.moveTo(0, 20);
        ctx.quadraticCurveTo(-45, 10, -35, -15); // Full cheek
        ctx.quadraticCurveTo(-25, -40, 0, -35);  // Top curve
        ctx.lineTo(0, 20);                       // Center seam
      });
      // Head right
      shape('#e0e0e0', () => {
        ctx.moveTo(0, 20);
        ctx.quadraticCurveTo(45, 10, 35, -15);
        ctx.quadraticCurveTo(25, -40, 0, -35);
        ctx.lineTo(0, 20);
      });

      // --- NECK (small part) ---
      shape('#ffffff', () => {
        ctx.moveTo(0, 15);
        ctx.lineTo(-25, 25); // Neck left
        ctx.quadraticCurveTo(-15, 45, 0, 45); // Bottom curve
        ctx.lineTo(0, 15);
      });
      shape('#f0f0f0', () => {
        ctx.moveTo(0, 15);
        ctx.lineTo(25, 25); // Neck right
        ctx.quadraticCurveTo(15, 45, 0, 45); // Bottom curve
        ctx.lineTo(0, 15);
      });

      // --- FACE ---
      // Eyes
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-12, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12, -5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      shape('#ffcccc', () => {
        ctx.moveTo(-3, 6);
        ctx.quadraticCurveTo(0, 4, 3, 6);
        ctx.quadraticCurveTo(0, 10, -3, 6);
      });

      // Mouth
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.quadraticCurveTo(-3, 15, 0, 10);
      ctx.quadraticCurveTo(3, 15, 6, 12);
      ctx.stroke();

      ctx.restore(); // END CLIP
    }

    // --- HANDS (drawn outside clip so they overlap the edge) ---
    if (pawProgress > 0.01) {
      const handScale = pawProgress * scale * 0.7; // Decreased size by 30%
      ctx.save();
      ctx.translate(x, y);
      
      const drawHand = (hx, hy, rot, color) => {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(rot);
        ctx.scale(handScale, handScale);
        
        // Hand shape (paw)
        ctx.fillStyle = color;
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Full ellipse for the paw, centered on the edge
        ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Fingers
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, -2); ctx.lineTo(-5, -12);
        ctx.moveTo(0, 0);   ctx.lineTo(0, -14);
        ctx.moveTo(5, -2);  ctx.lineTo(5, -12);
        ctx.stroke();
        
        ctx.restore();
      };

      const handDist = currentHoleRadius;
      
      // Left hand at ~20 degrees left of bottom center
      const leftAngle = Math.PI * 0.65;
      drawHand(Math.cos(leftAngle) * handDist, Math.sin(leftAngle) * handDist, leftAngle - Math.PI/2, '#ffffff');

      // Right hand at ~20 degrees right of bottom center
      const rightAngle = Math.PI * 0.35;
      drawHand(Math.cos(rightAngle) * handDist, Math.sin(rightAngle) * handDist, rightAngle - Math.PI/2, '#f0f0f0');

      ctx.restore();
    }
  }

  // ── Main Animation Loop ──────────────────────────────────────────────────────
  let activeBumpRadius = 127.5; // Animated ripple radius

  function draw() {
    const now = Date.now();

    // Blinking state update
    if (!isBlinking && Math.random() < 0.005 && (now - lastBlinkTime > 3000)) {
      isBlinking = true;
      blinkStartTime = now;
    }
    if (isBlinking && (now - blinkStartTime > 150)) {
      isBlinking = false;
      lastBlinkTime = now;
    }

    // Continuous smooth trailing bump — always lerp toward mouse, even while retracting.
    // Only freeze bump position while the hole is OPEN and fully expanded (POPPING_UP state).
    const holeIsOpen = state === 'POPPING_UP' && currentHoleRadius > baseRadius + 2;
    if (holeIsOpen) {
      // Freeze bump at the locked hole dot while bunny is fully emerged
      bumpX = holeDot.x;
      bumpY = holeDot.y;
    } else {
      // Always glide toward mouse — this runs during MOVING, EXPANDING, and RETRACTING
      activeBumpRadius += (127.5 - activeBumpRadius) * 0.1;
      const lerpFactor = 0.045; // ~1.5s glide to target
      bumpX += (mouseX - bumpX) * lerpFactor;
      bumpY += (mouseY - bumpY) * lerpFactor;
    }

    // State Logic — Bunny hole emerges ONLY from MOVING state, never from RETRACTING.
    // This prevents a new hole opening before the previous one fully closes.
    if (state === 'MOVING') {
      if (now - lastMoveTime > 2000 && mouseX !== -1000) {
        state = 'EXPANDING';
        
        // Find nearest grid dot to lock onto — snap to where bump actually IS
        const nx = Math.round(bumpX / gap) * gap;
        const ny = Math.round(bumpY / gap) * gap;
        holeDot = { x: nx, y: ny };
        holeTargetRadius = 60;
      }
    }
    
    // Animate hole radius
    currentHoleRadius += (holeTargetRadius - currentHoleRadius) * 0.08;
    
    // Transition to popping up when hole is wide enough
    if (state === 'EXPANDING' && currentHoleRadius > 48) {
      state = 'POPPING_UP';
      pawTargetProgress = 1;
      headPopStartTime = now + 500;
    }
    
    // Head emergence logic
    if (state === 'POPPING_UP') {
      if (now >= headPopStartTime && headPopStartTime !== 0) {
        headTargetProgress = 1;
      }
      if (headPopProgress > 0.99 && headTargetProgress === 1) {
        if (!earShakeStartTime) earShakeStartTime = now;
      }
    }

    // Retraction sequence
    if (state === 'RETRACTING') {
      if (now >= pawRetractStartTime && pawRetractStartTime !== 0) {
        pawTargetProgress = 0;
        holeTargetRadius = baseRadius;
        pawRetractStartTime = 0;
      }
    }
    
    // Transition back to MOVING when fully retracted.
    // IMPORTANT: reset lastMoveTime so the 2s idle timer starts fresh from this moment,
    // preventing an immediate re-open at a stale position.
    if (state === 'RETRACTING' && currentHoleRadius < baseRadius + 1 && pawTargetProgress === 0) {
      state = 'MOVING';
      holeDot = null;
      lastMoveTime = now; // <- reset idle timer; bump needs time to reach cursor before next open
    }

    // Animate pop progress
    pawPopProgress += (pawTargetProgress - pawPopProgress) * 0.1;
    headPopProgress += (headTargetProgress - headPopProgress) * 0.1;

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
          ctx.fillStyle = 'rgba(145,145,150,0.5)'; // 10% darker default
          
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
          
          // Fabric Bump — bumpX/Y always reflect correct position (frozen at holeDot during POPPING_UP, gliding during all other states)
          const curBumpX = bumpX;
          const curBumpY = bumpY;
          const bdx = x - curBumpX;
          const bdy = y - curBumpY;
          const bDist = Math.sqrt(bdx*bdx + bdy*bdy);
          
          if (bDist < activeBumpRadius && activeBumpRadius > 1) {
            // Distort outwards slightly
            const force = (activeBumpRadius - bDist) / activeBumpRadius;
            drawX += (bdx / bDist) * force * maxDistortion;
            drawY += (bdy / bDist) * force * maxDistortion;
            radius = baseRadius + (force * 1.5);
            
            ctx.fillStyle = `rgba(20,20,20,${0.45 + (force * 0.35)})`;
          }
          
          // Pre-emergence jitter: dots tremble near bump position when idle before bunny emerges
          const idleTime = now - lastMoveTime;
          if (idleTime > 800 && idleTime < 3000 && (state === 'MOVING' || state === 'RETRACTING' || state === 'EXPANDING')) {
            const jdx = x - bumpX;
            const jdy = y - bumpY;
            const jDist = Math.sqrt(jdx * jdx + jdy * jdy);
            const jitterRadius = 42;
            if (jDist < jitterRadius && jDist > 0) {
              const intensity = Math.min((idleTime - 800) / 1200, 1.0);
              const proximity = (jitterRadius - jDist) / jitterRadius;
              const jitterAmt = intensity * proximity * 1.8;
              drawX += Math.sin(now * 0.012 + x * 0.3) * jitterAmt;
              drawY += Math.cos(now * 0.009 + y * 0.3) * jitterAmt;
            }
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
      let earAngle = 0;
      if (earShakeStartTime > 0 && now - earShakeStartTime < 1000) {
        earAngle = Math.sin((now - earShakeStartTime) * 0.03) * 0.15;
      }
      drawBunny(ctx, holeDot.x, holeDot.y, 1.0, pawPopProgress, headPopProgress, earAngle);
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
