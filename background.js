/**
 * Pricehop Background — Fabric Bump + Grain Texture + Idle Bunny
 * Interactive dot grid with cursor-following entity, grain overlay,
 * and an origami bunny that pops out of a hole after 3s of inactivity.
 */

(function initBackground() {
  // ── 1. Canvas Setup ────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100%', 'height:100%',
    'z-index:-1', 'pointer-events:none',
  ].join(';');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGrain();
  });

  // ── Grain Texture ──────────────────────────────────────────────────────────
  let grainCanvas;
  function buildGrain() {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = grainCanvas.height = 300;
    const gc = grainCanvas.getContext('2d');
    const id = gc.createImageData(300, 300);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255 | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.random() < 0.3 ? (Math.random() * 16 | 0) : 0;
    }
    gc.putImageData(id, 0, 0);
  }
  buildGrain();

  // ── 2. State & Entity Tracking ─────────────────────────────────────────────
  let mouseX = W / 2;
  let mouseY = H / 2;

  let lastMouseX    = mouseX;
  let lastMouseY    = mouseY;
  let lastMoveTime  = Date.now();
  let mouseVelocity = 0;

  window.addEventListener('mousemove', (e) => {
    const now = Date.now();
    const dt  = now - lastMoveTime;
    if (dt > 0) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      mouseVelocity = Math.sqrt(dx * dx + dy * dy) / dt;
    }
    lastMouseX   = e.clientX;
    lastMouseY   = e.clientY;
    lastMoveTime = now;
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Retract bunny on any mouse movement
    if (bstate === 'EXPANDING' || bstate === 'POPPING_UP') {
      bstate = 'RETRACTING';
      holeTargetR     = currentHoleR;
      headTargetProg  = 0;
      pawRetractAt    = Date.now() + 400;
      headPopStartAt  = 0;
      earShakeStartAt = 0;
    }
  });

  // Invisible entity
  let entityX  = mouseX;
  let entityY  = mouseY;
  let entityVX = 0;
  let entityVY = 0;

  const posQueue    = [];
  const ENTITY_SPEED = 10;

  // ── 3. Grid & Fabric Bump constants ───────────────────────────────────────
  const gap              = 28;
  const baseRadius       = 0.7;
  const MAX_BUMP_RADIUS  = 127.5;
  const maxDistortion    = 25;

  // Live bump radius — eases to 0 near components, back to MAX otherwise
  let currentBumpRadius = MAX_BUMP_RADIUS;

  // ── Component Proximity Detection ─────────────────────────────────────────
  // Selector for UI elements (main.js handles the 3D phone and image popouts)
  const INTERACTIVE_SEL = 'a, button, input, select, textarea, label, [role="button"], [role="link"], .content-wrapper, #drow-text, #dday-text';
  const PROXIMITY_PX    = 25;
  let nearComponent     = false;

  function checkProximity(mx, my) {
    // Rely on main.js for the 3D phone model and complex popouts
    if (window.isExclusionZoneHovered) return true;

    const els = document.querySelectorAll(INTERACTIVE_SEL);
    for (const el of els) {
      // Skip elements that are fully transparent
      const opacity = el.style.opacity || window.getComputedStyle(el).opacity;
      if (opacity === '0' || opacity === '') {
        // Only skip if explicitly '0'. If empty, let computed style dictate (mostly not 0)
        if (opacity === '0' || window.getComputedStyle(el).opacity === '0') continue;
      }

      const r = el.getBoundingClientRect();
      // Expand rect by PROXIMITY_PX on all sides
      if (
        mx >= r.left   - PROXIMITY_PX &&
        mx <= r.right  + PROXIMITY_PX &&
        my >= r.top    - PROXIMITY_PX &&
        my <= r.bottom + PROXIMITY_PX &&
        r.width > 0 && r.height > 0
      ) {
        return true;
      }
    }
    return false;
  }

  // ── Bunny / Hole State ─────────────────────────────────────────────────────
  // States: 'MOVING' → idle 3s → 'EXPANDING' → hole big → 'POPPING_UP' → 'RETRACTING' → 'MOVING'
  let bstate = 'MOVING';

  let holeDot      = null;   // { x, y } grid dot where hole is
  let holeTargetR  = baseRadius;
  let currentHoleR = baseRadius;

  let pawProg       = 0;
  let pawTargetProg = 0;
  let headProg      = 0;
  let headTargetProg = 0;

  let headPopStartAt  = 0;
  let earShakeStartAt = 0;
  let pawRetractAt    = 0;

  let isBlinking    = false;
  let blinkStartAt  = 0;
  let lastBlinkAt   = Date.now();

  // ── Procedural Bunny ───────────────────────────────────────────────────────
  function drawBunny(cx, cy, scale, pawProgress, headProgress, earAngle) {
    if (pawProgress <= 0.01 && headProgress <= 0.01) return;

    // Head (clipped inside hole)
    if (headProgress > 0.01) {
      const yOffset = currentHoleR + 30 - (headProgress * 60);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, currentHoleR, 0, Math.PI * 2);
      ctx.clip();

      ctx.translate(cx, cy + yOffset);
      ctx.scale(scale * 0.77, scale * 0.77);

      const shape = (color, drawFn) => {
        ctx.fillStyle   = color;
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        ctx.beginPath();
        drawFn();
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // Ears
      ctx.save();
      ctx.rotate(earAngle);
      shape('#ffffff', () => {
        ctx.moveTo(-15, -15);
        ctx.quadraticCurveTo(-45, -30, -40, -80);
        ctx.quadraticCurveTo(-35, -95, -25, -85);
        ctx.quadraticCurveTo(-10, -50, -5, -20);
      });
      shape('#ffcccc', () => {
        ctx.moveTo(-15, -25);
        ctx.quadraticCurveTo(-35, -35, -30, -75);
        ctx.quadraticCurveTo(-26, -85, -22, -75);
        ctx.quadraticCurveTo(-10, -45, -8, -25);
      });
      ctx.restore();

      ctx.save();
      ctx.rotate(earAngle);
      shape('#f0f0f0', () => {
        ctx.moveTo(15, -15);
        ctx.quadraticCurveTo(45, -30, 40, -80);
        ctx.quadraticCurveTo(35, -95, 25, -85);
        ctx.quadraticCurveTo(10, -50, 5, -20);
      });
      shape('#ffe0e0', () => {
        ctx.moveTo(15, -25);
        ctx.quadraticCurveTo(35, -35, 30, -75);
        ctx.quadraticCurveTo(26, -85, 22, -75);
        ctx.quadraticCurveTo(10, -45, 8, -25);
      });
      ctx.restore();

      // Head halves
      shape('#ffffff', () => {
        ctx.moveTo(0, 20);
        ctx.quadraticCurveTo(-45, 10, -35, -15);
        ctx.quadraticCurveTo(-25, -40, 0, -35);
        ctx.lineTo(0, 20);
      });
      shape('#e0e0e0', () => {
        ctx.moveTo(0, 20);
        ctx.quadraticCurveTo(45, 10, 35, -15);
        ctx.quadraticCurveTo(25, -40, 0, -35);
        ctx.lineTo(0, 20);
      });

      // Neck
      shape('#ffffff', () => {
        ctx.moveTo(0, 15);
        ctx.lineTo(-25, 25);
        ctx.quadraticCurveTo(-15, 45, 0, 45);
        ctx.lineTo(0, 15);
      });
      shape('#f0f0f0', () => {
        ctx.moveTo(0, 15);
        ctx.lineTo(25, 25);
        ctx.quadraticCurveTo(15, 45, 0, 45);
        ctx.lineTo(0, 15);
      });

      // Eyes (with blinking)
      const eyeRadiusY = isBlinking ? 0.3 : 3;
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(-12, -5, 3, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -5, 3, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      shape('#ffcccc', () => {
        ctx.moveTo(-3, 6);
        ctx.quadraticCurveTo(0, 4, 3, 6);
        ctx.quadraticCurveTo(0, 10, -3, 6);
      });

      // Mouth
      ctx.strokeStyle = '#333';
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.quadraticCurveTo(-3, 15, 0, 10);
      ctx.quadraticCurveTo(3, 15, 6, 12);
      ctx.stroke();

      ctx.restore(); // end clip
    }

    // Paws (outside clip so they drape over edge)
    if (pawProgress > 0.01) {
      const handScale = pawProgress * scale * 0.7;
      ctx.save();
      ctx.translate(cx, cy);

      const drawHand = (hx, hy, rot, color) => {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(rot);
        ctx.scale(handScale, handScale);

        ctx.fillStyle   = color;
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, -2); ctx.lineTo(-5, -12);
        ctx.moveTo(0,  0);  ctx.lineTo(0,  -14);
        ctx.moveTo(5,  -2); ctx.lineTo(5,  -12);
        ctx.stroke();

        ctx.restore();
      };

      const r = currentHoleR;
      drawHand(
        Math.cos(Math.PI * 0.65) * r,
        Math.sin(Math.PI * 0.65) * r,
        Math.PI * 0.65 - Math.PI / 2,
        '#ffffff'
      );
      drawHand(
        Math.cos(Math.PI * 0.35) * r,
        Math.sin(Math.PI * 0.35) * r,
        Math.PI * 0.35 - Math.PI / 2,
        '#f0f0f0'
      );

      ctx.restore();
    }
  }

  // ── Main Animation Loop ────────────────────────────────────────────────────
  function draw() {
    const now = Date.now();

    // Update component proximity flag every frame (handles scrolling)
    nearComponent = checkProximity(mouseX, mouseY);

    // --- Blink logic ---
    if (!isBlinking && Math.random() < 0.005 && (now - lastBlinkAt > 3000)) {
      isBlinking   = true;
      blinkStartAt = now;
    }
    if (isBlinking && (now - blinkStartAt > 150)) {
      isBlinking = false;
      lastBlinkAt = now;
    }

    // --- Animate bump radius: disappears near components, returns otherwise ---
    const bumpTarget = nearComponent ? 0 : MAX_BUMP_RADIUS;
    currentBumpRadius += (bumpTarget - currentBumpRadius) * 0.12;

    // Retract bunny if near a component
    if (nearComponent && (bstate === 'EXPANDING' || bstate === 'POPPING_UP')) {
      bstate = 'RETRACTING';
      holeTargetR     = currentHoleR;
      headTargetProg  = 0;
      pawRetractAt    = now + 400;
      headPopStartAt  = 0;
      earShakeStartAt = 0;
    }

    // --- Entity Movement ---
    // Lock entity to holeDot when hole is visibly open
    if (holeDot && currentHoleR > baseRadius + 2) {
      entityX  = holeDot.x;
      entityY  = holeDot.y;
      entityVX = 0;
      entityVY = 0;
    } else {
      const fast = mouseVelocity > 1.2;

      if (fast) {
        posQueue.length = 0;
        entityVX *= 0.92;
        entityVY *= 0.92;
        entityX  += entityVX;
        entityY  += entityVY;
      } else {
        posQueue.push({ x: mouseX, y: mouseY });

        if (posQueue.length > 0) {
          const target = posQueue[0];
          const dx   = target.x - entityX;
          const dy   = target.y - entityY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= ENTITY_SPEED) {
            entityX  = target.x;
            entityY  = target.y;
            entityVX = 0;
            entityVY = 0;
            posQueue.shift();
          } else {
            entityVX = (dx / dist) * ENTITY_SPEED;
            entityVY = (dy / dist) * ENTITY_SPEED;
            entityX += entityVX;
            entityY += entityVY;
          }
        } else {
          const dx   = mouseX - entityX;
          const dy   = mouseY - entityY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > ENTITY_SPEED) {
            entityVX = (dx / dist) * ENTITY_SPEED;
            entityVY = (dy / dist) * ENTITY_SPEED;
            entityX += entityVX;
            entityY += entityVY;
          } else if (dist > 0.5) {
            entityX  = mouseX;
            entityY  = mouseY;
            entityVX = 0;
            entityVY = 0;
          }
        }
      }
    }

    // --- Bunny State Machine ---
    const idleMs = now - lastMoveTime;

    if (bstate === 'MOVING' || bstate === 'RETRACTING') {
      // Trigger after 3 seconds of no mouse movement, only when not near a component
      if (!nearComponent && idleMs >= 3000 && mouseX !== -1000) {
        bstate = 'EXPANDING';
        // Lock hole to nearest grid dot under the entity
        const nx = Math.round(entityX / gap) * gap;
        const ny = Math.round(entityY / gap) * gap;
        holeDot     = { x: nx, y: ny };
        holeTargetR = 60;
      }
    }

    // Animate hole radius
    currentHoleR += (holeTargetR - currentHoleR) * 0.08;

    if (bstate === 'EXPANDING' && currentHoleR > 48) {
      bstate         = 'POPPING_UP';
      pawTargetProg  = 1;
      headPopStartAt = now + 500;
    }

    if (bstate === 'POPPING_UP') {
      if (headPopStartAt !== 0 && now >= headPopStartAt) {
        headTargetProg = 1;
      }
      if (headProg > 0.99 && headTargetProg === 1 && !earShakeStartAt) {
        earShakeStartAt = now;
      }
    }

    if (bstate === 'RETRACTING') {
      if (pawRetractAt !== 0 && now >= pawRetractAt) {
        pawTargetProg  = 0;
        holeTargetR    = baseRadius;
        pawRetractAt   = 0;
      }
    }

    // Fully retracted → back to MOVING
    if (bstate === 'RETRACTING' && currentHoleR < baseRadius + 1 && pawTargetProg === 0 && pawProg < 0.02) {
      bstate  = 'MOVING';
      holeDot = null;
      headTargetProg  = 0;
      headProg        = 0;
      headPopStartAt  = 0;
      earShakeStartAt = 0;
    }

    // Animate progress values
    pawProg  += (pawTargetProg  - pawProg)  * 0.1;
    headProg += (headTargetProg - headProg) * 0.1;

    // --- Clear canvas ---
    canvas.width = W;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, W, H);

    // --- Grain texture (before dots) ---
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (let tx = 0; tx < W; tx += 300) {
      for (let ty = 0; ty < H; ty += 300) {
        ctx.drawImage(grainCanvas, tx, ty);
      }
    }
    ctx.restore();

    // --- Dot Grid with Fabric Bump + Hole ---
    const bumpX = (holeDot && currentHoleR > baseRadius + 2) ? holeDot.x : entityX;
    const bumpY = (holeDot && currentHoleR > baseRadius + 2) ? holeDot.y : entityY;

    ctx.save();

    for (let x = gap; x < W + gap; x += gap) {
      for (let y = gap; y < H + gap; y += gap) {
        let drawX  = x;
        let drawY  = y;
        let radius = baseRadius;
        let isHole = false;

        // Hole dot
        if (holeDot && Math.abs(x - holeDot.x) < 1 && Math.abs(y - holeDot.y) < 1) {
          radius = currentHoleR;
          isHole = true;
          ctx.fillStyle = '#111';
        } else {
          ctx.fillStyle = 'rgba(145,145,150,0.5)';

          // Push dots away from open hole
          if (holeDot && currentHoleR > baseRadius) {
            const hdx  = x - holeDot.x;
            const hdy  = y - holeDot.y;
            const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
            if (hdist < currentHoleR + 30 && hdist > 0) {
              const push = (currentHoleR + 30 - hdist) / 30;
              drawX += (hdx / hdist) * push * 30;
              drawY += (hdy / hdist) * push * 30;
            }
          }

          // Fabric bump
          const bdx  = x - bumpX;
          const bdy  = y - bumpY;
          const bdist = Math.sqrt(bdx * bdx + bdy * bdy);

          if (bdist < currentBumpRadius && bdist > 0 && currentBumpRadius > 1) {
            const force = (currentBumpRadius - bdist) / currentBumpRadius;
            drawX  += (bdx / bdist) * force * maxDistortion;
            drawY  += (bdy / bdist) * force * maxDistortion;
            radius  = baseRadius + (force * 1.5);
            ctx.fillStyle = `rgba(110,110,115,${0.5 + force * 0.3})`;
          }
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    // --- Bunny ---
    if (holeDot) {
      let earAngle = 0;
      if (earShakeStartAt > 0 && now - earShakeStartAt < 1200) {
        earAngle = Math.sin((now - earShakeStartAt) * 0.03) * 0.15;
      }
      drawBunny(holeDot.x, holeDot.y, 1.0, pawProg, headProg, earAngle);
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
