/**
 * tinder-cards.js
 * Discover Swipe View for Pricehop Web
 * Modeled directly after Flutter's discover_swipe_view.dart & discover_provider.dart
 */

import ip1Image from './assets/ip1.png';
import ip2Image from './assets/ip2.png';
import ip3Image from './assets/ip3.png';
import ip4Image from './assets/ip4.png';
import logoStrip from './assets/logo strip.png';

const PRODUCTS = [
  {
    id: 1,
    image: ip1Image,
    name: 'Nike Air Max 270',
    category: 'Footwear',
    price: 9499,
    store: 'Myntra',
    logoAsset: '/src/assets/logo strip.png',
  },
  {
    id: 2,
    image: ip2Image,
    name: 'Apple AirPods Pro (2nd Gen)',
    category: 'Audio',
    price: 21499,
    store: 'Amazon',
    logoAsset: '/src/assets/logo strip.png',
  },
  {
    id: 3,
    image: ip3Image,
    name: 'Fossil Gen 6 Smartwatch',
    category: 'Wearables',
    price: 17999,
    store: 'Flipkart',
    logoAsset: '/src/assets/logo strip 2.png',
  },
  {
    id: 4,
    image: ip4Image,
    name: 'Sony WH-1000XM5 Wireless',
    category: 'Audio',
    price: 23999,
    store: 'Croma',
    logoAsset: '/src/assets/logo strip 2.png',
  },
];

let deckPointer = 0;
let overlay = null;
let cardStack = null;
let likedCount = 0;
let isSwiping = false;

function openOverlay() {
  if (overlay) return;
  deckPointer = 0;
  likedCount = 0;

  overlay = document.createElement('div');
  overlay.className = 'tc-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Discover for You');
  overlay.innerHTML = `
    <div class="tc-modal">
      <header class="tc-header">
        <div class="tc-header-title">
          <span class="tc-brand-title">Discover for You</span>
        </div>
        <div class="tc-header-meta">
          <button class="tc-close-btn" id="tc-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </header>
      <div class="tc-arena">
        <div class="tc-stack" id="tc-stack"></div>
      </div>
      <div class="tc-actions">
        <button class="tc-btn tc-btn--pass" id="tc-btn-pass" aria-label="Pass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="tc-btn tc-btn--star" id="tc-btn-star" aria-label="Save deal">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
        </button>
        <button class="tc-btn tc-btn--like" id="tc-btn-like" aria-label="Like deal">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('tc-overlay--open'));

  cardStack = overlay.querySelector('#tc-stack');
  renderStack();

  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) closeOverlay(); });
  overlay.querySelector('#tc-close').addEventListener('click', closeOverlay);
  overlay.querySelector('#tc-btn-pass').addEventListener('click', () => programmaticSwipe('left'));
  overlay.querySelector('#tc-btn-like').addEventListener('click', () => programmaticSwipe('right'));
  overlay.querySelector('#tc-btn-star').addEventListener('click', () => programmaticSwipe('up'));

  const keyHandler = (e) => {
    if (e.key === 'Escape')     { closeOverlay(); }
    if (e.key === 'ArrowRight') { programmaticSwipe('right'); }
    if (e.key === 'ArrowLeft')  { programmaticSwipe('left'); }
    if (e.key === 'ArrowUp')    { programmaticSwipe('up'); }
  };
  document.addEventListener('keydown', keyHandler);
  overlay._keyHandler = keyHandler;

  if (window.lenis) window.lenis.stop();
}

function closeOverlay() {
  if (!overlay) return;
  document.removeEventListener('keydown', overlay._keyHandler);
  overlay.classList.remove('tc-overlay--open');
  overlay.classList.add('tc-overlay--closing');
  setTimeout(() => { overlay?.remove(); overlay = null; cardStack = null; }, 380);
  if (window.lenis) window.lenis.start();
}

function renderStack() {
  if (!cardStack) return;
  cardStack.innerHTML = '';

  if (deckPointer >= PRODUCTS.length) {
    showEndScreen();
    return;
  }

  // Display up to 3 cards in stack at once
  const remaining = PRODUCTS.length - deckPointer;
  const count = Math.min(3, remaining);

  for (let si = count - 1; si >= 0; si--) {
    const product = PRODUCTS[deckPointer + si];
    if (!product) continue;
    const card = buildCard(product, si);
    cardStack.appendChild(card);
    if (si === 0) attachDrag(card);
  }
}

function buildCard(product, stackIdx) {
  const el = document.createElement('article');
  el.className = 'tc-card';
  el.setAttribute('data-si', stackIdx);
  el.innerHTML = `
    <div class="tc-card__inner">
      <div class="tc-card__img-container">
        <img class="tc-card__img" src="${product.image}" alt="${product.name}" loading="lazy" draggable="false" />
      </div>
      <div class="tc-stamp tc-stamp--like">LIKE ❤️</div>
      <div class="tc-stamp tc-stamp--pass">PASS ✕</div>
      <div class="tc-stamp tc-stamp--star">SAVE ⭐</div>
      
      <!-- Bottom Details Panel matching discover_swipe_view.dart -->
      <div class="tc-card__details">
        <h3 class="tc-card__title">${product.name}</h3>
        <div class="tc-card__price">₹${product.price.toLocaleString('en-IN')}</div>
        
        <!-- 5-Star Rating Row -->
        <div class="tc-card__rating">
          <span class="tc-star">★</span>
          <span class="tc-star">★</span>
          <span class="tc-star">★</span>
          <span class="tc-star">★</span>
          <span class="tc-star">★</span>
        </div>

        <!-- Store Logo Badge Bottom Right -->
        <div class="tc-card__store-badge">
          <img src="${product.logoAsset}" alt="${product.store}" class="tc-store-logo" />
        </div>
      </div>
    </div>
  `;
  applyStackStyle(el, stackIdx, false);
  return el;
}

/**
 * Rotational stack tilt matching discover_swipe_view.dart:
 * - Top card: tilt = 0.0 rad (0deg), translateX = 0
 * - 1st card behind (si = 1): tilt = +0.08 rad (+4.5deg), translateX = +12px, translateY = 9px
 * - 2nd card behind (si = 2): tilt = -0.08 rad (-4.5deg), translateX = -12px, translateY = 18px
 */
const STACK_CFG = [
  { scale: 1.00, rot: 0,     tx: 0,   ty: 0,  opacity: 1.0, zIndex: 30 },
  { scale: 0.97, rot: 4.5,   tx: 12,  ty: 9,  opacity: 0.88, zIndex: 20 },
  { scale: 0.94, rot: -4.5,  tx: -12, ty: 18, opacity: 0.72, zIndex: 10 },
];

function applyStackStyle(card, si, animated = true) {
  const c = STACK_CFG[si] ?? { scale: 0.90, rot: 0, tx: 0, ty: 24, opacity: 0.5, zIndex: 5 };
  if (animated) {
    card.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
  } else {
    card.style.transition = 'none';
  }
  card.style.transform = `scale(${c.scale}) translate(${c.tx}px, ${c.ty}px) rotate(${c.rot}deg)`;
  card.style.opacity = c.opacity;
  card.style.zIndex = c.zIndex;
  card.style.cursor = si === 0 ? 'grab' : 'default';
  card.setAttribute('data-si', si);
}

function doSwipe(card, direction) {
  if (isSwiping || !card) return;
  isSwiping = true;

  const stampSel = { right: '.tc-stamp--like', left: '.tc-stamp--pass', up: '.tc-stamp--star' };
  const stamp = card.querySelector(stampSel[direction]);
  if (stamp && parseFloat(stamp.style.opacity || 0) < 0.5) stamp.style.opacity = '1';

  let tx = 0, ty = 0, rot = 0;
  if (direction === 'right') { tx = window.innerWidth + 300;  rot = 22; }
  else if (direction === 'left')  { tx = -(window.innerWidth + 300); rot = -22; }
  else if (direction === 'up')    { ty = -(window.innerHeight + 200); }

  card.style.transition = 'transform 0.52s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.52s ease';
  card.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
  card.style.opacity = '0';
  card.style.pointerEvents = 'none';

  if (direction === 'right' || direction === 'up') {
    likedCount++;
  }

  deckPointer++;
  promoteStack();
  addBackCard();

  setTimeout(() => {
    card.remove();
    isSwiping = false;
    if (deckPointer >= PRODUCTS.length) {
      showEndScreen();
    }
  }, 540);
}

function programmaticSwipe(direction) {
  const topCard = cardStack?.querySelector('.tc-card[data-si="0"]');
  if (topCard && !isSwiping) doSwipe(topCard, direction);
}

function promoteStack() {
  cardStack?.querySelectorAll('.tc-card').forEach((card) => {
    const si = parseInt(card.getAttribute('data-si'));
    if (si === 0) return;
    const newSi = si - 1;
    applyStackStyle(card, newSi, true);
    if (newSi === 0) attachDrag(card);
  });
}

function addBackCard() {
  const backIdx = deckPointer + 2;
  if (backIdx >= PRODUCTS.length || !cardStack) return;
  const card = buildCard(PRODUCTS[backIdx], 2);
  card.style.transition = 'none';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.90) translate(-12px, 24px) rotate(-4.5deg)';
  card.style.zIndex = '10';
  cardStack.prepend(card);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
    card.style.opacity = '0.72';
    card.style.transform = 'scale(0.94) translate(-12px, 18px) rotate(-4.5deg)';
  }));
}

/**
 * End Screen after 4 products are swiped
 * Displays "Find more in the app" call-to-action
 */
function showEndScreen() {
  if (!cardStack) return;
  
  const actionsEl = overlay?.querySelector('.tc-actions');
  if (actionsEl) actionsEl.style.display = 'none';

  cardStack.innerHTML = `
    <div class="tc-app-cta-card">
      <div class="tc-app-icon">📱</div>
      <h3 class="tc-app-title">Find more in the app</h3>
      <p class="tc-app-subtitle">Download Pricehop to discover 10,000+ real-time price comparisons & personalized deals tailored for you.</p>
      
      <div class="tc-app-badges">
        <a href="#" class="tc-app-badge">
          <span class="tc-badge-sub">Download on the</span>
          <span class="tc-badge-main">App Store</span>
        </a>
        <a href="#" class="tc-app-badge">
          <span class="tc-badge-sub">GET IT ON</span>
          <span class="tc-badge-main">Google Play</span>
        </a>
      </div>
    </div>
  `;
}

function attachDrag(card) {
  let dragging = false;
  let sx = 0, sy = 0, cx = 0, cy = 0;
  let velX = 0, lastX = 0, lastT = 0;

  card.addEventListener('pointerdown', (e) => {
    if (isSwiping) return;
    e.preventDefault();
    card.setPointerCapture(e.pointerId);
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    lastX = e.clientX; lastT = Date.now();
    cx = 0; cy = 0; velX = 0;
    card.style.transition = 'none';
    card.style.cursor = 'grabbing';
    card.style.zIndex = '50';
  });

  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    cx = e.clientX - sx;
    cy = e.clientY - sy;
    const now = Date.now();
    const dt = Math.max(now - lastT, 1);
    velX = (e.clientX - lastX) / dt;
    lastX = e.clientX; lastT = now;

    const rot = cx * 0.075;
    card.style.transform = `translate(${cx}px, ${cy}px) rotate(${rot}deg)`;

    const likeStamp = card.querySelector('.tc-stamp--like');
    const passStamp = card.querySelector('.tc-stamp--pass');
    const starStamp = card.querySelector('.tc-stamp--star');
    const isUp = cy < -50 && Math.abs(cx) < 70;
    if (isUp) {
      if (starStamp) starStamp.style.opacity = Math.min(Math.max(-cy / 80, 0), 1);
      if (likeStamp) likeStamp.style.opacity = 0;
      if (passStamp) passStamp.style.opacity = 0;
    } else {
      if (starStamp) starStamp.style.opacity = 0;
      if (likeStamp) likeStamp.style.opacity = cx > 20 ? Math.min(cx / 90, 1) : 0;
      if (passStamp) passStamp.style.opacity = cx < -20 ? Math.min(-cx / 90, 1) : 0;
    }
  });

  card.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    card.style.cursor = 'grab';
    const DIST = 100, VEL = 0.38;
    const isUp = cy < -85 && Math.abs(cx) < 70;
    if (isUp) {
      doSwipe(card, 'up');
    } else if (cx > DIST || (velX > VEL && cx > 30)) {
      doSwipe(card, 'right');
    } else if (cx < -DIST || (velX < -VEL && cx < -30)) {
      doSwipe(card, 'left');
    } else {
      card.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.transform = 'scale(1) translate(0px, 0px) rotate(0deg)';
      card.style.zIndex = STACK_CFG[0].zIndex;
      card.querySelectorAll('.tc-stamp').forEach(s => { s.style.opacity = 0; });
    }
  });

  card.addEventListener('pointercancel', () => { dragging = false; });
}

export function initTinderCards() {
  const btn = document.querySelector('.glowing-btn');
  if (btn) btn.addEventListener('click', openOverlay);
}
