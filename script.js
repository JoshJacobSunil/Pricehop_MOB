document.addEventListener('DOMContentLoaded', () => {
    
    const scrollyContainer = document.getElementById('scrolly-container');
    const totalSteps = 8; // Steps 0 to 8 (9 total screens)
    
    // 6 Logical UI Steps mapping to 9 frames
    const stepData = {
        0: null, // Hidden on hero
        1: { num: 1, title: "1st Step: The Feed", desc: "Best Deals, One Feed." },
        2: { num: 1, title: "1st Step: The Feed", desc: "Best Deals, One Feed." },
        3: { num: 2, title: "2nd Step: Swipe & Save", desc: "Swipe right to like, left to pass." },
        4: { num: 3, title: "3rd Step: Smart Search", desc: "Everything Starts With a Search." },
        5: { num: 4, title: "4th Step: Quick Access", desc: "One Tap Away From a Better Price." },
        6: { num: 4, title: "4th Step: Quick Access", desc: "Explore features directly in-app." },
        7: { num: 5, title: "5th Step: Compare", desc: "See Best Deals in Best Platforms." },
        8: { num: 6, title: "6th Step: Price Alerts", desc: "Discover Today's Biggest Deal." }
    };

    function updateScrollState() {
        const rect = scrollyContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        let currentStep = 0;

        // If above container
        if (rect.top > 0) {
            currentStep = 0;
            document.body.setAttribute('data-step', '0');
        } 
        // If below container
        else if (rect.bottom < windowHeight) {
            currentStep = totalSteps;
            document.body.setAttribute('data-step', totalSteps.toString());
        } 
        // Inside container
        else {
            const scrollDistance = Math.abs(rect.top);
            currentStep = Math.floor(scrollDistance / windowHeight);
            
            if (currentStep > totalSteps) currentStep = totalSteps;
            if (currentStep < 0) currentStep = 0;
            
            document.body.setAttribute('data-step', currentStep.toString());
        }

        updateStepperUI(currentStep);
    }

    function updateStepperUI(currentStep) {
        const data = stepData[currentStep];
        const stepperOverlay = document.getElementById('stepper-overlay');
        
        if (!data) {
            stepperOverlay.classList.remove('visible');
            return;
        }

        stepperOverlay.classList.add('visible');
        document.getElementById('stepper-title').innerText = data.title;
        document.getElementById('stepper-desc').innerText = data.desc;

        // Update nodes
        const nodes = document.querySelectorAll('.step-node');
        const activeIndex = data.num - 1; // 0-indexed (0 to 5)

        nodes.forEach((node, idx) => {
            if (idx < activeIndex) {
                node.className = 'step-node completed';
                node.innerHTML = '<div class="node-inner">✓</div>';
            } else if (idx === activeIndex) {
                node.className = 'step-node active';
                node.innerHTML = `<div class="node-inner">${idx + 1}</div>`;
            } else {
                node.className = 'step-node';
                node.innerHTML = `<div class="node-inner">${idx + 1}</div>`;
            }
        });

        // Update progress line (Percentage relative to 5 intervals between 6 nodes)
        const linePercent = (activeIndex / 5) * 100;
        document.getElementById('step-line-active').style.width = linePercent + '%';
    }

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();


    // Progress Bar
    const progressBar = document.getElementById('progress-bar');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        if(progressBar) progressBar.style.width = scrollPercent + '%';
    }, { passive: true });


    // Countdown Timer
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

    let launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 14);

    function updateCountdown() {
        const now = new Date();
        const diff = launchDate - now;

        if(diff <= 0) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if(daysEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            hoursEl.innerText = hours.toString().padStart(2, '0');
            minsEl.innerText = minutes.toString().padStart(2, '0');
            secsEl.innerText = seconds.toString().padStart(2, '0');
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
});
