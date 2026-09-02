/**
 * PRICEHOP MOBILE — RAYCAST-INSPIRED INTERACTIONS & ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
    initSpotlightEffect();
    initSimulator();
    initQRModal();
    initWaitlistForm();
    initNavbarScroll();
    initMobileMenu();
});

/* ================= 1. MOUSE-TRACKING SPOTLIGHT EFFECT ================= */
function initSpotlightEffect() {
    const spotlightCards = document.querySelectorAll('.spotlight-card');

    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

/* ================= 2. INTERACTIVE PHONE SIMULATOR ================= */
function initSimulator() {
    const stepItems = document.querySelectorAll('.step-item');
    const simScreens = document.querySelectorAll('.simulator-screen');
    const simBadge = document.getElementById('sim-badge');
    const simTitle = document.getElementById('sim-title');
    const simDesc = document.getElementById('sim-desc');
    const simulatorContainer = document.querySelector('.simulator-container');
    const simFrame = document.querySelector('.simulator-frame');

    const stepData = [
        {
            badge: "STEP 1 OF 4",
            title: "Discover & Swipe Deals",
            desc: "Smart recommendation algorithm learns what you love."
        },
        {
            badge: "STEP 2 OF 4",
            title: "Compare Real-Time Stores",
            desc: "Live prices from Amazon, Flipkart, Myntra & 50+ stores."
        },
        {
            badge: "STEP 3 OF 4",
            title: "Set Price Drop Radars",
            desc: "Cloud monitoring alerts you instantly when prices drop."
        },
        {
            badge: "STEP 4 OF 4",
            title: "One-Tap Deal Hop",
            desc: "Direct deep-linking to store checkout with auto coupon codes."
        }
    ];

    let currentStep = 0;
    let autoPlayInterval = null;
    let isInteracting = false;

    function activateStep(index) {
        if (index < 0) index = stepItems.length - 1;
        if (index >= stepItems.length) index = 0;
        currentStep = index;

        // Update Stepper List / Tabs
        stepItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Update Simulator Screen in iPhone mockup
        simScreens.forEach((screen, i) => {
            screen.classList.toggle('active', i === index);
        });

        // Update Status Card
        if (simBadge && simTitle && simDesc && stepData[index]) {
            simBadge.textContent = stepData[index].badge;
            simTitle.textContent = stepData[index].title;
            simDesc.textContent = stepData[index].desc;
        }
    }

    // Step Item Click / Tap Handlers
    stepItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            activateStep(index);
            resetAutoPlay();
        });
    });

    // Touch Swipe Gesture on Phone Mockup
    if (simFrame) {
        let touchStartX = 0;
        let touchStartY = 0;

        simFrame.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isInteracting = true;
        }, { passive: true });

        simFrame.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Horizontal swipe detected (more than 40px and predominantly horizontal)
            if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX < 0) {
                    // Swiped Left -> Next Step
                    activateStep(currentStep + 1);
                } else {
                    // Swiped Right -> Prev Step
                    activateStep(currentStep - 1);
                }
                resetAutoPlay();
            }
            setTimeout(() => { isInteracting = false; }, 1000);
        }, { passive: true });
    }

    // Auto-advance loop every 4.5 seconds
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (!isInteracting) {
                const nextStep = (currentStep + 1) % stepItems.length;
                activateStep(nextStep);
            }
        }, 4500);
    }

    function resetAutoPlay() {
        startAutoPlay();
    }

    if (simulatorContainer) {
        simulatorContainer.addEventListener('mouseenter', () => { isInteracting = true; });
        simulatorContainer.addEventListener('mouseleave', () => { isInteracting = false; });
    }

    startAutoPlay();
}

/* ================= 3. QR CODE MODAL ================= */
function initQRModal() {
    const openBtn = document.getElementById('open-qr-btn');
    const closeBtn = document.getElementById('close-qr-btn');
    const modal = document.getElementById('qr-modal');

    if (!modal) return;

    function openModal() {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

/* ================= 4. WAITLIST FORM HANDLING ================= */
function initWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const successMsg = document.getElementById('waitlist-success');
    const emailInput = document.getElementById('waitlist-email');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (email && email.includes('@')) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Joining...</span>';
            }

            // Simulate immediate API response
            setTimeout(() => {
                form.style.display = 'none';
                if (successMsg) {
                    successMsg.classList.add('show');
                }
            }, 600);
        }
    });
}

/* ================= 5. NAVBAR SCROLL ENHANCEMENT ================= */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar-container');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 12px 35px rgba(11, 59, 36, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.88)';
            navbar.style.boxShadow = '0 8px 25px rgba(11, 59, 36, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
        }
    }, { passive: true });
}

/* ================= 6. MOBILE MENU ================= */
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('mobile-open');
    });

    // Close on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('mobile-open');
        });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('mobile-open') && !navLinks.contains(e.target) && !toggle.contains(e.target)) {
            navLinks.classList.remove('mobile-open');
        }
    });
}
