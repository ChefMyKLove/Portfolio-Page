// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_BASE_URL: 'https://portfolio-and-blog-production.up.railway.app',
    ENABLE_ANALYTICS: true,
    PRELOAD_IMAGES: true,
    DEBUG: false
};

// Shared image list — used by background cycle and cloud cycle independently
const BG_IMAGES = [
    'images/HummingBow.jpg',  'images/IMG_6794.JPEG', 'images/IMG_6795.JPEG',
    'images/IMG_6796.JPEG',   'images/IMG_6797.JPEG', 'images/TunnelBow.JPEG',
    'images/IMG_6906.JPEG',   'images/IMG_6907.JPEG', 'images/IMG_6908.JPEG',
    'images/IMG_6909.JPEG',   'images/IMG_6910.JPEG', 'images/IMG_6911.JPEG',
    'images/IMG_6912.JPEG'
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
const log = (message, data = null) => {
    if (CONFIG.DEBUG) {
        console.log(`[Splash] ${message}`, data || '');
    }
};

const logError = (message, error = null) => {
    console.error(`[Splash Error] ${message}`, error || '');
};

// ============================================
// ANALYTICS TRACKING
// ============================================
async function trackVisit() {
    if (!CONFIG.ENABLE_ANALYTICS) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/analytics/visit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: 'splash',
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight
            })
        });

        if (response.ok) {
            log('Visit tracked successfully');
        } else {
            log('Failed to track visit', await response.text());
        }
    } catch (error) {
        logError('Error tracking visit', error);
    }
}

async function trackButtonClick(buttonName, destination) {
    if (!CONFIG.ENABLE_ANALYTICS) return;
    
    try {
        await fetch(`${CONFIG.API_BASE_URL}/analytics/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                button: buttonName,
                page: 'splash',
                destination: destination,
                timestamp: new Date().toISOString()
            })
        });
        
        log(`Click tracked: ${buttonName}`);
    } catch (error) {
        logError('Error tracking click', error);
    }
}

// ============================================
// IMAGE PRELOADING
// ============================================
function preloadBackgroundImages() {
    if (!CONFIG.PRELOAD_IMAGES) return;
    
    // Actual image files in the images directory
    const imageNames = [
        'IMG_6794.JPEG',
        'IMG_6795.JPEG',
        'IMG_6796.JPEG',
        'IMG_6797.JPEG',
        'IMG_6906.JPEG',
        'IMG_6907.JPEG',
        'IMG_6908.JPEG',
        'IMG_6909.JPEG',
        'IMG_6910.JPEG',
        'IMG_6911.JPEG',
        'IMG_6912.JPEG',
        'TunnelBow.JPEG',
        'HummingBow.jpg'
    ];
    
    let loadedCount = 0;
    
    log('Preloading background images...');
    
    imageNames.forEach((imageName, idx) => {
        const img = new Image();
        img.src = `images/${imageName}`;
        img.onload = () => {
            loadedCount++;
            log(`Image ${idx + 1} loaded (${loadedCount}/${imageNames.length})`);
            if (loadedCount === imageNames.length) {
                log('All images preloaded successfully');
                document.body.classList.remove('loading');
            }
        };
        img.onerror = () => {
            logError(`Failed to load image: ${imageName}`);
        };
    });
}

// ============================================
// EMAIL MODAL FUNCTIONALITY
// ============================================
function setupEmailModal() {
    const emailTrigger = document.getElementById('emailTrigger');
    const modal = document.getElementById('contactModal');
    const closeBtn = document.querySelector('.close');
    let clickTimer = null;

    if (!emailTrigger || !modal || !closeBtn) {
        logError('Email modal elements not found');
        return;
    }

    // Handle single/double click on email
    emailTrigger.addEventListener('click', function(e) {
        const email = this.getAttribute('data-email');
        
        if (clickTimer === null) {
            // First click - set timer to copy email
            clickTimer = setTimeout(() => {
                // Single click - copy to clipboard
                navigator.clipboard.writeText(email).then(() => {
                    const originalText = emailTrigger.textContent;
                    emailTrigger.textContent = 'Email copied to clipboard!';
                    setTimeout(() => {
                        emailTrigger.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    logError('Failed to copy email', err);
                });
                clickTimer = null;
            }, 300);
        }
    });

    emailTrigger.addEventListener('dblclick', function(e) {
        // Double click - clear timer and open modal
        clearTimeout(clickTimer);
        clickTimer = null;
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        // Animate modal in
        setTimeout(() => {
            modal.style.transition = 'opacity 0.5s ease';
            modal.style.opacity = '1';
        }, 10);
        
        log('Contact modal opened');
    });

    // Handle click on contact animation image
    const contactAnimationImage = document.querySelector('.contact-animation-image');
    let imageClickTimer = null;
    
    if (contactAnimationImage) {
        contactAnimationImage.addEventListener('click', function(e) {
            const email = emailTrigger.getAttribute('data-email');
            
            if (imageClickTimer === null) {
                // First click - set timer to copy email
                imageClickTimer = setTimeout(() => {
                    // Single click - copy to clipboard
                    navigator.clipboard.writeText(email).then(() => {
                        const originalText = contactAnimationImage.textContent;
                        contactAnimationImage.textContent = 'Copied!';
                        setTimeout(() => {
                            contactAnimationImage.textContent = originalText;
                        }, 2000);
                    }).catch(err => {
                        logError('Failed to copy email', err);
                    });
                    imageClickTimer = null;
                }, 300);
            }
        });
        
        contactAnimationImage.addEventListener('dblclick', function(e) {
            // Double click - clear timer and open modal
            clearTimeout(imageClickTimer);
            imageClickTimer = null;
            modal.style.display = 'flex';
            modal.style.opacity = '0';
            
            // Animate modal in
            setTimeout(() => {
                modal.style.transition = 'opacity 0.5s ease';
                modal.style.opacity = '1';
            }, 10);
            
            log('Contact modal opened from image double-click');
        });
    }

    // Close modal on X button
    closeBtn.addEventListener('click', () => {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        log('Contact modal closed');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            log('Contact modal closed (outside click)');
        }
    });

    // Handle form submission with AJAX
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default form submission
            log('Contact form submitted');
            
            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            // Disable button and show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Create and show success message overlay
                    const successOverlay = document.createElement('div');
                    successOverlay.className = 'success-overlay';
                    successOverlay.innerHTML = `
                        <div class="success-message">
                            <div class="success-icon">✓</div>
                            <h3>Message Sent!</h3>
                            <p>Thanks for reaching out. I'll get back to you soon.</p>
                        </div>
                    `;
                    document.body.appendChild(successOverlay);
                    
                    // Animate success message in
                    setTimeout(() => {
                        successOverlay.style.opacity = '1';
                        const successMsg = successOverlay.querySelector('.success-message');
                        successMsg.style.transform = 'scale(1)';
                        successMsg.style.opacity = '1';
                    }, 10);
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Close everything after delay
                    setTimeout(() => {
                        successOverlay.style.opacity = '0';
                        setTimeout(() => {
                            successOverlay.remove();
                            modal.style.transition = 'opacity 0.3s ease';
                            modal.style.opacity = '0';
                            setTimeout(() => {
                                modal.style.display = 'none';
                                submitButton.textContent = originalButtonText;
                                submitButton.disabled = false;
                            }, 300);
                        }, 300);
                    }, 2500);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                logError('Form submission error', error);
                submitButton.textContent = '✗ Failed. Try again?';
                submitButton.style.background = 'rgba(244, 67, 54, 0.8)';
                submitButton.disabled = false;
                
                setTimeout(() => {
                    submitButton.textContent = originalButtonText;
                    submitButton.style.background = '';
                }, 3000);
            }
        });
    }

    log('Email modal setup complete');
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Track button and link clicks
    document.querySelectorAll('.btn, .link').forEach(element => {
        element.addEventListener('click', (e) => {
            const buttonName = element.textContent.trim();
            const destination = element.getAttribute('href');
            trackButtonClick(buttonName, destination);
            log(`User clicked: ${buttonName}`);
        });
    });

    // Staggered Button Animation
    const buttons = document.querySelectorAll('.btn, .nav-button, .patreon-btn, .blog-btn');
    buttons.forEach((btn, i) => {
        btn.style.opacity = 0;
        setTimeout(() => {
            btn.style.transition = 'opacity 0.7s cubic-bezier(.4,2,.6,1)';
            btn.style.opacity = 1;
        }, 400 + i * 300);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Press 'M' for Members Blog
        if (e.key === 'm' || e.key === 'M') {
            const membersBtn = document.querySelector('a[href*="blog"]');
            if (membersBtn) {
                log('Keyboard shortcut: M (Members Blog)');
                membersBtn.click();
            }
        }

        // Press 'P' for Patreon
        if (e.key === 'p' || e.key === 'P') {
            const patreonBtn = document.querySelector('a[href*="patreon"]');
            if (patreonBtn) {
                log('Keyboard shortcut: P (Patreon)');
                patreonBtn.click();
            }
        }

        // Press 'F' for Full Portfolio
        if (e.key === 'f' || e.key === 'F') {
            const portfolioLink = document.querySelector('a.link[href*="chefmyklove.com"]');
            if (portfolioLink) {
                log('Keyboard shortcut: F (Full Portfolio)');
                portfolioLink.click();
            }
        }

        // Number keys 1-5 for navigation buttons
        const navLinks = document.querySelectorAll('nav a.nav-button');
        if (e.key >= '1' && e.key <= '5') {
            const index = parseInt(e.key) - 1;
            if (navLinks[index]) {
                log(`Keyboard shortcut: ${e.key} (${navLinks[index].textContent.trim()})`);
                navLinks[index].focus();
                navLinks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    log('Event listeners configured');
}

// ============================================
// VISIBILITY TRACKING
// ============================================
function setupVisibilityTracking() {
    let startTime = Date.now();
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            log(`User left page after ${timeSpent} seconds`);
            
            if (CONFIG.ENABLE_ANALYTICS && timeSpent > 3) {
                navigator.sendBeacon(
                    `${CONFIG.API_BASE_URL}/analytics/time-spent`,
                    JSON.stringify({
                        page: 'splash',
                        timeSpent: timeSpent,
                        timestamp: new Date().toISOString()
                    })
                );
            }
        } else {
            startTime = Date.now();
        }
    });
}

// ============================================
// PERFORMANCE MONITORING
// ============================================
function logPerformanceMetrics() {
    if (!CONFIG.DEBUG) return;
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                log('Performance Metrics:', {
                    'DOM Load': `${Math.round(perfData.domContentLoadedEventEnd)}ms`,
                    'Full Load': `${Math.round(perfData.loadEventEnd)}ms`,
                    'DNS': `${Math.round(perfData.domainLookupEnd - perfData.domainLookupStart)}ms`,
                    'TCP': `${Math.round(perfData.connectEnd - perfData.connectStart)}ms`
                });
            }
        }, 0);
    });
}

// ============================================
// ERROR HANDLING
// ============================================
window.addEventListener('error', (e) => {
    logError('Global error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

window.addEventListener('unhandledrejection', (e) => {
    logError('Unhandled promise rejection', e.reason);
});

// ============================================
// BACKGROUND + CLOUD SWIRL CYCLE
// Two swirl copies only — base layers hidden so images ride directly on the
// dark body background. rAF drives sinusoidal crossfades with a hold at peak.
//   FADE_MS  — time for each crossfade (in or out), sinusoidal curve
//   HOLD_MS  — time each image holds at full opacity before fading out
// ============================================
function initBackgroundCycle() {
    const FADE_MS = 9000;
    const HOLD_MS = 4000;
    const N = BG_IMAGES.length;

    const bgBot = document.getElementById('bgLayerA');
    const bgTop = document.getElementById('bgLayerB');
    const c1Bot = document.getElementById('cloud1A');
    const c1Top = document.getElementById('cloud1B');
    const c2Bot = document.getElementById('cloud2A');
    const c2Top = document.getElementById('cloud2B');
    if (!c1Bot || !c1Top) return;

    BG_IMAGES.forEach(src => { const img = new Image(); img.src = src; });

    // Hide base layers — only the two swirl copies are rendered
    [bgBot, bgTop].forEach(el => { if (el) { el.style.transition = 'none'; el.style.opacity = '0'; } });
    [c1Bot, c1Top, c2Bot, c2Top].filter(Boolean).forEach(el => { el.style.transition = 'none'; });

    let topSrc = BG_IMAGES[1];
    let topIdx  = 1;

    function setImg(el, src) { if (el) el.style.backgroundImage = `url('${src}')`; }
    function setOp(els, v)   { const s = v.toFixed(4); els.forEach(el => { if (el) el.style.opacity = s; }); }

    const botEls = [c1Bot, c2Bot].filter(Boolean);
    const topEls = [c1Top, c2Top].filter(Boolean);

    function applyBot(src) { botEls.forEach(el => setImg(el, src)); }
    function applyTop(src) { topSrc = src; topEls.forEach(el => setImg(el, src)); }

    applyBot(BG_IMAGES[0]);
    applyTop(BG_IMAGES[1]);
    setOp(botEls, 1.0);
    setOp(topEls, 0.0);

    // Start with a hold so the first image has full presence before anything fades
    let phase = 'hold';
    let phaseStart = null;

    function tick(ts) {
        if (!phaseStart) phaseStart = ts;

        if (phase === 'hold') {
            if (ts - phaseStart >= HOLD_MS) {
                phase = 'crossfade';
                phaseStart = ts;
            }
        } else {
            const f = Math.min((ts - phaseStart) / FADE_MS, 1.0);
            setOp(botEls, Math.cos(f * Math.PI / 2));
            setOp(topEls, Math.sin(f * Math.PI / 2));

            if (f >= 1.0) {
                // Crossfade complete — swap slots and hold
                topIdx = (topIdx + 1) % N;
                applyBot(topSrc);
                applyTop(BG_IMAGES[topIdx]);
                setOp(botEls, 1.0);
                setOp(topEls, 0.0);
                phase = 'hold';
                phaseStart = ts;
            }
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// ============================================
// CLOUD TURBULENCE ANIMATION
// Continuously mutates SVG feTurbulence baseFrequency
// to create the living, breathing displacement effect.
// ============================================
let cloudAnimT = 0;
let cloudAnimRaf = null;

function startCloudAnim() {
    const turb  = document.getElementById('cloud-turb');
    const turb2 = document.getElementById('cloud-turb-b');
    if (!turb) return;

    function tick() {
        cloudAnimT += 0.00065;
        const fx  = 0.009 + Math.sin(cloudAnimT * 1.10) * 0.012 + Math.sin(cloudAnimT * 2.30) * 0.006;
        const fy  = 0.011 + Math.cos(cloudAnimT * 0.75) * 0.011 + Math.cos(cloudAnimT * 1.90) * 0.006;
        turb.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(5)}`);
        if (turb2) {
            const fx2 = 0.010 + Math.sin(cloudAnimT * 0.85 + 2.10) * 0.012 + Math.sin(cloudAnimT * 1.70) * 0.006;
            const fy2 = 0.009 + Math.cos(cloudAnimT * 0.60 + 1.50) * 0.011 + Math.cos(cloudAnimT * 1.50) * 0.006;
            turb2.setAttribute('baseFrequency', `${fx2.toFixed(5)} ${fy2.toFixed(5)}`);
        }
        cloudAnimRaf = requestAnimationFrame(tick);
    }
    tick();
}

// ============================================
// PHASE 1 INTRO — 5s timer + skip handlers
// ============================================
let introTimer = null;
let phase2Started = false;

function initIntro() {
    const hint = document.getElementById('skipHint');

    // If the user already saw the intro this session, skip straight to phase 2
    if (sessionStorage.getItem('splashSeen')) {
        phase2Started = true;
        if (hint) hint.classList.add('hidden');
        startPhase2();
        return;
    }

    function triggerSkip() {
        if (phase2Started) return;
        phase2Started = true;
        clearTimeout(introTimer);
        sessionStorage.setItem('splashSeen', '1');

        document.removeEventListener('click', triggerSkip);
        document.removeEventListener('keydown', keySkip);

        if (hint) hint.classList.add('hidden');

        // Small delay so the click doesn't immediately fire on the circle
        setTimeout(startPhase2, 80);
    }

    function keySkip(e) {
        const ignored = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];
        if (!ignored.includes(e.key)) triggerSkip();
    }

    document.addEventListener('click', triggerSkip);
    document.addEventListener('keydown', keySkip);

    introTimer = setTimeout(triggerSkip, 5000);
}

function startPhase2() {
    animateCircleIn();
}

// ============================================
// BOP PHYSICS — spring-return interaction
// Hold 180ms or drag 6px to bop; short click still navigates.
// ============================================
class BopBody {
    constructor(el, opts = {}) {
        this.el       = el;
        this.isCircle = opts.isCircle || false;
        this.ox = 0; this.oy = 0;
        this.vx = 0; this.vy = 0;
        this.rafId   = null;
        this.spring  = opts.spring   || 0.08;
        this.damping = opts.damping  || 0.86;
        this.strength = opts.strength || 28;

        let pressT = 0, pressX = 0, pressY = 0, didBop = false;

        el.addEventListener('mousedown', (e) => {
            pressT = Date.now(); pressX = e.clientX; pressY = e.clientY; didBop = false;
        });
        el.addEventListener('mouseup', (e) => {
            const dt = Date.now() - pressT;
            if (dt > 180 || Math.hypot(e.clientX - pressX, e.clientY - pressY) > 6) {
                didBop = true;
                this._bop(pressX, pressY);
            }
        });
        el.addEventListener('click', (e) => {
            if (didBop) { e.preventDefault(); e.stopPropagation(); didBop = false; }
        });
        el.addEventListener('touchstart', (e) => {
            const t = e.touches[0]; pressT = Date.now(); pressX = t.clientX; pressY = t.clientY;
        }, { passive: true });
        el.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            if (Date.now() - pressT > 180 || Math.hypot(t.clientX - pressX, t.clientY - pressY) > 6) {
                e.preventDefault(); this._bop(pressX, pressY);
            }
        });
    }

    _bop(mx, my) {
        const r  = this.el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = cx - mx, dy = cy - my;
        const d  = Math.hypot(dx, dy) || 1;
        this.vx += (dx / d) * this.strength;
        this.vy += (dy / d) * this.strength;
        if (!this.rafId) this._tick();
    }

    _tick() {
        this.vx += -this.ox * this.spring;
        this.vy += -this.oy * this.spring;
        this.vx *= this.damping;
        this.vy *= this.damping;
        this.ox += this.vx;
        this.oy += this.vy;
        this._apply();

        if (Math.abs(this.vx) + Math.abs(this.vy) > 0.1 || Math.abs(this.ox) + Math.abs(this.oy) > 0.4) {
            this.rafId = requestAnimationFrame(() => this._tick());
        } else {
            this.ox = 0; this.oy = 0; this.vx = 0; this.vy = 0; this.rafId = null;
            this._apply();
        }
    }

    _apply() {
        const x = this.ox.toFixed(1), y = this.oy.toFixed(1);
        if (this.isCircle) {
            this.el.style.translate = (this.ox || this.oy)
                ? `calc(-50% + ${x}px) calc(-50% + ${y}px)`
                : '-50% -50%';
        } else {
            this.el.style.transform = (this.ox || this.oy)
                ? `translate(${x}px, ${y}px) scale(1)`
                : '';
        }
    }
}

// ============================================
// PHASE 2 — CIRCLE ENTRANCE + IDLE SPIN
// CSS translate property drives position.
// JS rotate property drives spin.
// They compose independently — no gap or freeze.
// ============================================

// ---- Analog Clock Drawing ----
function drawAnalogClock(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) / 2 - 2;
    const now = new Date();

    ctx.clearRect(0, 0, W, H);

    // Face: very light tint — just enough to separate hands from busy backgrounds
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4, 2, 14, 0.18)';
    ctx.fill();
    // Faint edge glow ring
    const faceGlow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
    faceGlow.addColorStop(0, 'rgba(102, 80, 200, 0)');
    faceGlow.addColorStop(1, 'rgba(102, 80, 200, 0.08)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = faceGlow;
    ctx.fill();
    ctx.restore();

    // Tick marks
    for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isHour = i % 5 === 0;
        const outerR = r - 5;
        const innerR = isHour ? r - 20 : r - 12;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
        ctx.strokeStyle = isHour ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth   = isHour ? 2.5 : 1;
        ctx.lineCap     = 'round';
        if (isHour)  { ctx.shadowColor = 'rgba(200,160,255,0.95)'; ctx.shadowBlur = 14; }
        else         { ctx.shadowColor = 'rgba(255,255,255,0.4)';  ctx.shadowBlur = 4;  }
        ctx.stroke();
        ctx.restore();
    }

    // Hour numerals (small, elegant)
    ctx.save();
    ctx.font = `bold ${Math.round(r * 0.13)}px inherit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(180,140,255,0.85)';
    ctx.shadowBlur = 10;
    for (let h = 1; h <= 12; h++) {
        const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
        const nr = r * 0.72;
        ctx.fillText(h, cx + Math.cos(a) * nr, cy + Math.sin(a) * nr);
    }
    ctx.restore();

    // Helper: draw a clock hand with shadow glow
    function hand(angle, length, width, color, glowColor) {
        ctx.save();
        ctx.beginPath();
        // Small counterweight tail
        ctx.moveTo(cx - Math.cos(angle) * length * 0.14, cy - Math.sin(angle) * length * 0.14);
        ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
        ctx.strokeStyle = color;
        ctx.lineWidth   = width;
        ctx.lineCap     = 'round';
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur  = 18;
        ctx.stroke();
        ctx.restore();
    }

    // Hour hand
    const hVal = now.getHours() % 12 + now.getMinutes() / 60 + now.getSeconds() / 3600;
    hand((hVal / 12) * Math.PI * 2 - Math.PI / 2, r * 0.50, 5.5,
         'rgba(255,255,255,0.96)', 'rgba(160,130,255,0.8)');

    // Minute hand
    const mVal = now.getMinutes() + now.getSeconds() / 60;
    hand((mVal / 60) * Math.PI * 2 - Math.PI / 2, r * 0.73, 3.5,
         'rgba(255,255,255,0.92)', 'rgba(160,130,255,0.6)');

    // Second hand — smooth sweep (uses milliseconds)
    const sVal = now.getSeconds() + now.getMilliseconds() / 1000;
    hand((sVal / 60) * Math.PI * 2 - Math.PI / 2, r * 0.80, 1.5,
         'rgba(210,170,255,0.97)', 'rgba(200,140,255,0.9)');

    // Center jewel
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(210,170,255,1)';
    ctx.shadowColor = 'rgba(200,140,255,0.9)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
}

function animateCircleIn() {
    const circle = document.getElementById('splashCircle');
    const ring   = document.getElementById('splashRing');
    if (!circle) return;

    const inner     = circle.querySelector('.circle-inner');
    const TOP_SPEED = 16; // degrees per frame at 60fps
    let angle         = 0;
    let speed         = TOP_SPEED;
    let running       = true;
    let frameId;
    let hint          = null;
    let translateDone = false;
    let spinStopped   = false;

    // ---- Clock setup ----
    const clockCanvas = document.getElementById('analogClock');
    let clockRaf = null;
    let clockFading = false;

    // Clock is hidden until the circle settles — started in onTranslateEnd
    if (clockCanvas) {
        clockCanvas.style.opacity = '0';
    }

    function startClock() {
        if (!clockCanvas) return;
        const sz = circle.getBoundingClientRect();
        clockCanvas.width  = Math.round(sz.width)  || 480;
        clockCanvas.height = Math.round(sz.height) || 480;

        function clockTick() {
            if (!clockFading) drawAnalogClock(clockCanvas);
            clockRaf = requestAnimationFrame(clockTick);
        }
        clockRaf = requestAnimationFrame(clockTick);

        // Fade in after one painted frame
        requestAnimationFrame(() => requestAnimationFrame(() => {
            clockCanvas.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            clockCanvas.style.opacity = '1';
        }));
    }

    revealCircleContents();

    function updateBlur(spd) {
        if (inner) inner.style.filter = `blur(${(spd / TOP_SPEED * 9).toFixed(1)}px)`;
    }

    updateBlur(speed);

    // ---- Deceleration state ----
    // Uses easeOutCubic over a pre-computed total arc so the wheel always lands upright (0°).
    const STOP_DURATION = 3200; // ms
    let stopTimestamp = null;
    let angleAtStop   = 0;
    let totalDecayDeg = 0;

    function tick() {
        if (!running) {
            // First decel frame — lock in the stopping parameters
            if (stopTimestamp === null) {
                stopTimestamp = performance.now();
                angleAtStop   = angle;
                // Choose a natural coast distance (~⅓ of what full-speed-for-STOP_DURATION would be)
                // then round up to the nearest full rotation so the wheel lands at 0°
                const naturalCoast = Math.max(speed * (STOP_DURATION / (1000 / 60)) * 0.33, 540);
                const rawEnd = (angleAtStop + naturalCoast) % 360;
                const extra  = rawEnd < 0.1 ? 0 : (360 - rawEnd) % 360;
                totalDecayDeg = naturalCoast + extra;
            }

            const elapsed = performance.now() - stopTimestamp;
            const t = Math.min(elapsed / STOP_DURATION, 1);

            // easeOutCubic: starts fast, glides to a gentle stop
            const eased = 1 - Math.pow(1 - t, 3);
            angle = angleAtStop + totalDecayDeg * eased;

            // Derivative of easeOutCubic → instantaneous speed fraction for blur
            const blurSpeed = speed * 3 * Math.pow(1 - t, 2);
            updateBlur(blurSpeed);

            const displayAngle = angle % 360;
            circle.style.rotate = `${displayAngle}deg`;
            // Keep clock face upright as wheel decelerates
            if (clockCanvas && !clockFading) clockCanvas.style.rotate = `-${displayAngle}deg`;

            if (t >= 1) {
                // Snap to exactly upright
                circle.style.rotate = '0deg';
                if (clockCanvas && !clockFading) clockCanvas.style.rotate = '0deg';
                if (inner) inner.style.filter = '';
                cancelAnimationFrame(frameId);
                if (!translateDone) {
                    spinStopped = true;
                    return;
                }
                onSpinComplete();
                return;
            }

            frameId = requestAnimationFrame(tick);
            return;
        }

        // Normal spin — counter-rotate canvas so clock stays upright
        angle = (angle + speed) % 360;
        circle.style.rotate = `${angle}deg`;
        if (clockCanvas && !clockFading) clockCanvas.style.rotate = `-${angle}deg`;
        frameId = requestAnimationFrame(tick);
    }

    function onSpinComplete() {
        if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
        new BopBody(circle, { isCircle: true, strength: 40, spring: 0.055, damping: 0.89 });

        if (!clockCanvas) return;
        let clockShowing = false;
        circle.addEventListener('click', () => {
            if (clockShowing) {
                clockShowing = false;
                clockFading = true;
                clockCanvas.style.transition = 'opacity 0.5s ease';
                clockCanvas.style.opacity = '0';
                setTimeout(() => {
                    if (clockRaf) { cancelAnimationFrame(clockRaf); clockRaf = null; }
                    clockCanvas.style.display = 'none';
                    clockFading = false;
                }, 550);
            } else {
                clockShowing = true;
                clockFading = false;
                clockCanvas.style.display = '';
                clockCanvas.style.opacity = '0';
                startClock();
            }
        });
    }

    frameId = requestAnimationFrame(tick);

    requestAnimationFrame(() => {
        circle.classList.add('entered');
        if (ring) ring.classList.add('entered');
    });

    setTimeout(revealBubbles, 2700);

    circle.addEventListener('animationend', function onTranslateEnd(e) {
        if (e.animationName !== 'circleTranslateIn') return;
        circle.removeEventListener('animationend', onTranslateEnd);
        circle.style.animation = 'none';
        circle.style.translate = '-50% -50%';
        translateDone = true;

        // Trigger land acknowledgement circle after main circle settles
        setTimeout(() => {
            const landCircle = document.getElementById('landCircle');
            const landTitle  = document.getElementById('landTitle');
            if (landCircle) landCircle.classList.add('active');
            if (landTitle)  landTitle.classList.add('active');
        }, 1800);

        if (spinStopped) {
            onSpinComplete();
            return;
        }

        startClock();

        hint = document.createElement('div');
        hint.id = 'spinHint';
        hint.textContent = 'click to reveal';
        hint.style.cssText = [
            'position:fixed',
            'top:50%',
            'left:38vw',
            'transform:translate(-50%,calc(-50% + ' + (circle.getBoundingClientRect().height / 2 + 14) + 'px))',
            'z-index:101',
            'color:rgba(255,255,255,0.8)',
            'font-size:0.72rem',
            'letter-spacing:0.14em',
            'text-transform:uppercase',
            'pointer-events:none',
            'opacity:0',
            'transition:opacity 0.5s ease',
            'text-shadow:0 1px 5px rgba(0,0,0,1),0 2px 10px rgba(0,0,0,0.9)',
            'user-select:none',
            'font-family:inherit',
        ].join(';');
        document.body.appendChild(hint);
        requestAnimationFrame(() => requestAnimationFrame(() => { hint.style.opacity = '1'; }));
    });

    function handleStop() {
        if (!running) return;
        running = false;
        if (hint) hint.style.opacity = '0';

        // Fade out the clock as the wheel winds down
        if (clockCanvas && !clockFading) {
            clockFading = true;
            clockCanvas.style.transition = 'opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1)';
            clockCanvas.style.opacity = '0';
            setTimeout(() => {
                if (clockRaf) cancelAnimationFrame(clockRaf);
                clockCanvas.style.display = 'none';
            }, 1200);
        }

        circle.removeEventListener('click', handleStop);
    }

    circle.addEventListener('click', handleStop);
}

function revealCircleContents() {
    const items = [
        document.querySelector('.circle-profile'),
        document.querySelector('.circle-name'),
        document.querySelector('.circle-tagline'),
        document.querySelector('.circle-bio'),
    ];

    items.forEach((el, i) => {
        if (!el) return;
        setTimeout(() => el.classList.add('revealed'), i * 160);
    });
}

// ============================================
// BUBBLE ENTRANCE — staggered spring pop-in
// ============================================
function revealBubbles() {
    const bubbles = document.querySelectorAll('.nav-bubble');
    bubbles.forEach((bubble, i) => {
        setTimeout(() => {
            bubble.classList.add('visible');
            new BopBody(bubble, { strength: 22, spring: 0.10, damping: 0.85 });
        }, i * 80);
    });
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    startCloudAnim();
    initIntro();
    initBackgroundCycle();
    log('Initializing splash page...');

    // Add loading class
    document.body.classList.add('loading');

    // Track page visit
    trackVisit();

    // Preload images
    preloadBackgroundImages();

    // Setup email modal only if its elements exist on this page
    if (document.getElementById('emailTrigger')) setupEmailModal();

    // Setup other event listeners
    setupEventListeners();

    // Setup visibility tracking
    setupVisibilityTracking();

    // Log performance
    logPerformanceMetrics();

    log('Splash page initialized successfully');

    // Log keyboard shortcuts hint
    if (CONFIG.DEBUG) {
        console.log('%c💡 Keyboard Shortcuts:', 'color: #667eea; font-size: 14px; font-weight: bold;');
        console.log('  M = Members Blog');
        console.log('  P = Patreon');
        console.log('  F = Full Portfolio');
        console.log('  1-5 = Navigate to sections');
    }
}

// ============================================
// START APPLICATION
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// EXPOSE API (for console debugging)
// ============================================
if (CONFIG.DEBUG) {
    window.SplashPage = {
        config: CONFIG,
        trackVisit,
        trackButtonClick,
        preloadBackgroundImages
    };
}

// ============================================
// ART CAROUSEL & PRINTIFY MODAL
// ============================================
const ArtCarousel = {
    init() {
        const artworks = [
            { 
                image: 'images/TunnelBow.JPEG', 
                printifyUrl: 'https://ordinalrainbows.printify.me/product/25134633/tunnelbow',
                title: 'TunnelBow',
                alt: 'TunnelBow - Rainbow light through glass tunnel'
            },
            { 
                image: 'images/IMG_6795.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #1',
                alt: 'Rainbow artwork #1'
            },
            { 
                image: 'images/IMG_6797.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #2',
                alt: 'Rainbow artwork #2'
            },
            { 
                image: 'images/IMG_6910.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #3',
                alt: 'Rainbow artwork #3'
            },
            { 
                image: 'images/IMG_6911.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #4',
                alt: 'Rainbow artwork #4'
            },
            { 
                image: 'images/IMG_6908.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #5',
                alt: 'Rainbow artwork #5'
            },
            { 
                image: 'images/IMG_6909.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #6',
                alt: 'Rainbow artwork #6'
            },
            { 
                image: 'images/IMG_6912.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #7',
                alt: 'Rainbow artwork #7'
            },
            { 
                image: 'images/IMG_6906.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #8',
                alt: 'Rainbow artwork #8'
            },
            { 
                image: 'images/IMG_6907.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #9',
                alt: 'Rainbow artwork #9'
            },
            { 
                image: 'images/IMG_6796.JPEG', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #10',
                alt: 'Rainbow artwork #10'
            },
            { 
                image: 'images/HummingBow.jpg', 
                printifyUrl: 'PENDING',
                title: 'Rainbow #11',
                alt: 'Rainbow artwork #11'
            }
        ];

        const inner = document.getElementById('art-carousel-inner');
        if (!inner) return; // Art carousel not on this page
        
        let idx = 0;
        const itemsCount = artworks.length;
        const itemWidth = 33.33; // 3 items visible at once

        // Create items (we'll create them multiple times for infinite loop)
        const createArtworkElement = (artwork) => {
            const div = document.createElement('div');
            div.className = 'art-carousel-item';
            
            if (artwork.printifyUrl && artwork.printifyUrl !== 'PENDING') {
                div.style.cursor = 'pointer';
                div.onclick = () => openPrintifyModal(artwork.printifyUrl, artwork.title);
                
                div.innerHTML = `
                    <img src="${artwork.image}" 
                         alt="${artwork.alt}" 
                         title="Click to order ${artwork.title}">
                    <div class="art-carousel-order-label">🛒 Order Print</div>
                `;
            } else {
                div.innerHTML = `
                    <img src="${artwork.image}" 
                         alt="${artwork.alt}" 
                         title="${artwork.title}">
                    <div class="art-carousel-coming-soon">Coming Soon</div>
                `;
            }
            
            return div;
        };

        // Create carousel items 3 times (original + 2 copies for seamless looping)
        artworks.forEach(artwork => inner.appendChild(createArtworkElement(artwork)));
        artworks.forEach(artwork => inner.appendChild(createArtworkElement(artwork)));
        artworks.forEach(artwork => inner.appendChild(createArtworkElement(artwork)));

        const updateCarousel = () => {
            inner.style.transition = 'transform 0.5s ease';
            inner.style.transform = `translateX(-${idx * itemWidth}%)`;
        };

        // Navigation
        const prevBtn = document.getElementById('art-carousel-prev');
        const nextBtn = document.getElementById('art-carousel-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                idx = (idx - 1 + itemsCount * 3) % (itemsCount * 3);
                updateCarousel();
                
                // Loop back seamlessly if needed
                setTimeout(() => {
                    if (idx >= itemsCount * 2) {
                        inner.style.transition = 'none';
                        idx = idx - itemsCount;
                        inner.style.transform = `translateX(-${idx * itemWidth}%)`;
                    }
                }, 500);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                idx++;
                updateCarousel();
                
                // Loop back seamlessly
                setTimeout(() => {
                    if (idx >= itemsCount * 2) {
                        inner.style.transition = 'none';
                        idx = idx - itemsCount;
                        inner.style.transform = `translateX(-${idx * itemWidth}%)`;
                    }
                }, 500);
            });
        }
    }
};

// Printify Modal Handler
function openPrintifyModal(url, title) {
    const modal = document.createElement('div');
    modal.className = 'printify-modal';
    modal.innerHTML = `
        <div class="printify-modal-content">
            <div class="printify-modal-header">
                <h2>${title}</h2>
                <span class="printify-modal-close">&times;</span>
            </div>
            <iframe src="${url}" class="printify-iframe"></iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeBtn = modal.querySelector('.printify-modal-close');
    closeBtn.onclick = () => closePrintifyModal(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) closePrintifyModal(modal);
    };
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closePrintifyModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closePrintifyModal(modal) {
    modal.remove();
    document.body.style.overflow = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ArtCarousel.init();
});