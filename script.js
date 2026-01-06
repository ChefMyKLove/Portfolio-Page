// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_BASE_URL: 'http://localhost:3002',
    ENABLE_ANALYTICS: true,
    PRELOAD_IMAGES: true,
    DEBUG: false
};

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
    
    const imageCount = 13;
    const images = [];
    let loadedCount = 0;
    
    log('Preloading background images...');
    
    for (let i = 1; i <= imageCount; i++) {
        const img = new Image();
        img.src = `images/IMG_${i}.JPEG`;
        img.onload = () => {
            loadedCount++;
            log(`Image ${i} loaded (${loadedCount}/${imageCount})`);
            if (loadedCount === imageCount) {
                log('All images preloaded successfully');
                document.body.classList.remove('loading');
            }
        };
        img.onerror = () => {
            logError(`Failed to load image ${i}`);
        };
        images.push(img);
    }
    return images;
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
// INITIALIZATION
// ============================================
function init() {
    log('Initializing splash page...');
    
    // Add loading class
    document.body.classList.add('loading');
    
    // Track page visit
    trackVisit();
    
    // Preload images
    preloadBackgroundImages();
    
    // Setup email modal (MUST be called separately)
    setupEmailModal();
    
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