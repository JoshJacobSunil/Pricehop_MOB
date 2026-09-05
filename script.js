/**
 * PRICEHOP MOBILE — RAYCAST-INSPIRED INTERACTIONS & ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
    initSpotlightEffect();
    initSimulator();
    initBentoScrollAnimation();
    initQRModal();
    initWaitlistForm();
    initCountdownTimer();
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
    let manualOverrideTimeout = null;

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
            isInteracting = true;
            if (manualOverrideTimeout) clearTimeout(manualOverrideTimeout);
            manualOverrideTimeout = setTimeout(() => { isInteracting = false; }, 3500);
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
            if (manualOverrideTimeout) clearTimeout(manualOverrideTimeout);
            manualOverrideTimeout = setTimeout(() => { isInteracting = false; }, 3500);
        }, { passive: true });
    }

    // Scroll-Driven Step Changing: As user scrolls through the phone/simulator section
    let lastScrollStep = -1;
    window.addEventListener('scroll', () => {
        if (!simFrame || isInteracting) return;
        const rect = simFrame.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // When simulator is active in the viewport
        if (rect.bottom > 80 && rect.top < windowHeight - 80) {
            // Calculate progress as the phone travels across the viewport midpoint
            const phoneCenter = rect.top + rect.height / 2;
            const screenCenter = windowHeight / 2;
            
            // Progress ranges from 0 (entering screen) to 1 (leaving top)
            const progress = (windowHeight - rect.top) / (windowHeight + rect.height * 0.7);
            const clamped = Math.max(0, Math.min(0.999, progress));
            const targetStep = Math.floor(clamped * 4);

            if (targetStep !== currentStep && targetStep !== lastScrollStep) {
                lastScrollStep = targetStep;
                activateStep(targetStep);
            }
        }
    }, { passive: true });

    // Auto-advance loop every 4 seconds
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            if (!isInteracting) {
                const nextStep = (currentStep + 1) % stepItems.length;
                activateStep(nextStep);
            }
        }, 4000);
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

    // Close on scroll or touch move
    const closeMobileMenu = () => {
        if (navLinks.classList.contains('mobile-open')) {
            navLinks.classList.remove('mobile-open');
        }
    };

    window.addEventListener('scroll', closeMobileMenu, { passive: true });
    window.addEventListener('touchmove', closeMobileMenu, { passive: true });
    window.addEventListener('wheel', closeMobileMenu, { passive: true });
}

/* ================= 7. LAUNCH COUNTDOWN TIMER (OCTOBER 2, 2026 AFTERNOON) ================= */
function initCountdownTimer() {
    // Target: October 2, 2026 at 12:00:00 PM IST (Afternoon)
    const targetDate = new Date('2026-10-02T12:00:00+05:30').getTime();

    const daysEl = document.getElementById('timer-days');
    const hoursEl = document.getElementById('timer-hours');
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updateTimer() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

/* ================= 8. CORE CAPABILITIES HORIZONTAL CAROUSEL & DOTS ================= */
function initBentoScrollAnimation() {
    const track = document.getElementById('bento-track');
    const bentoCards = document.querySelectorAll('#features .bento-card');
    const dots = document.querySelectorAll('#bento-dots .bento-dot');
    if (!track || !bentoCards.length) return;

    function updateActiveCard() {
        const scrollLeft = track.scrollLeft;
        const trackWidth = track.clientWidth;
        let activeIndex = 0;
        let minDistance = Infinity;

        bentoCards.forEach((card, index) => {
            const cardLeft = card.offsetLeft - track.offsetLeft;
            const cardCenter = cardLeft + card.offsetWidth / 2;
            const visibleCenter = scrollLeft + trackWidth / 2;
            const distance = Math.abs(cardCenter - visibleCenter);

            if (distance < minDistance) {
                minDistance = distance;
                activeIndex = index;
            }
        });

        bentoCards.forEach((card, index) => {
            card.classList.toggle('card-center', index === activeIndex);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    track.addEventListener('scroll', updateActiveCard, { passive: true });
    window.addEventListener('resize', updateActiveCard, { passive: true });

    // Click dot to navigate
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const targetCard = bentoCards[index];
            if (targetCard) {
                const targetLeft = targetCard.offsetLeft - track.offsetLeft - (track.clientWidth - targetCard.offsetWidth) / 2;
                track.scrollTo({
                    left: Math.max(0, targetLeft),
                    behavior: 'smooth'
                });
            }
        });
    });

    // Auto-scroll hint teaser when user scrolls section into center of screen
    let hasAutoNudged = false;
    let userInteracted = false;

    track.addEventListener('touchstart', () => { userInteracted = true; }, { passive: true });
    track.addEventListener('mousedown', () => { userInteracted = true; }, { passive: true });
    track.addEventListener('wheel', () => { userInteracted = true; }, { passive: true });

    const featuresSection = document.getElementById('features');
    if (featuresSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAutoNudged && !userInteracted && track.scrollLeft < 30) {
                    hasAutoNudged = true;

                    // Slight natural pause before smooth auto-scroll to card 2
                    setTimeout(() => {
                        if (!userInteracted && bentoCards.length > 1 && track.scrollLeft < 30) {
                            const targetCard = bentoCards[1];
                            if (targetCard) {
                                const targetLeft = targetCard.offsetLeft - track.offsetLeft - (track.clientWidth - targetCard.offsetWidth) / 2;
                                track.scrollTo({
                                    left: Math.max(0, targetLeft),
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }, 500);
                }
            });
        }, {
            threshold: 0.35
        });

        observer.observe(featuresSection);
    }

    updateActiveCard();
}
