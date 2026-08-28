document.addEventListener('DOMContentLoaded', () => {
    
    const scrollyContainer = document.getElementById('scrolly-container');
    const totalSteps = 7; // Steps 0 to 7 (8 total)
    
    function updateScrollState() {
        const rect = scrollyContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // If above container
        if (rect.top > 0) {
            document.body.setAttribute('data-step', '0');
        } 
        // If below container
        else if (rect.bottom < windowHeight) {
            document.body.setAttribute('data-step', totalSteps.toString());
        } 
        // Inside container
        else {
            const scrollDistance = Math.abs(rect.top);
            // Exactly 1 step per viewport height scrolled
            let currentStep = Math.floor(scrollDistance / windowHeight);
            
            if (currentStep > totalSteps) currentStep = totalSteps;
            if (currentStep < 0) currentStep = 0;
            
            document.body.setAttribute('data-step', currentStep.toString());
        }
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
