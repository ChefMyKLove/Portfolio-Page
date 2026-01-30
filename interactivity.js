document.addEventListener('DOMContentLoaded', () => {
  // Firefox detection
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  
  // ===== NOTIFICATION SYSTEM =====
  function showNotification(message) {
    // Remove any existing notifications first
    const existingOverlay = document.getElementById('notification-overlay');
    const existingToast = document.getElementById('notification-toast');
    if (existingOverlay) existingOverlay.remove();
    if (existingToast) existingToast.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'notification-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99998;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // Create toast container
    const toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      z-index: 99999;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    // Create content box with animated background (like rest of site)
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(102, 126, 234, 0.5);
      border-radius: 28px;
      padding: 50px 70px;
      min-width: 480px;
      max-width: 90vw;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(102, 126, 234, 0.3);
      text-align: center;
    `;
    
    // Create ::before pseudo-element equivalent for background animation
    const bgLayer = document.createElement('div');
    bgLayer.style.cssText = `
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      border-radius: inherit;
      animation: backgroundCycle 78s infinite ease-in-out;
    `;
    content.appendChild(bgLayer);
    
    // Create message
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #fff;
      font-size: 1.6em;
      font-weight: 600;
      margin-bottom: 30px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(102, 126, 234, 0.5);
    `;
    
    // Create OK button with animated background
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
      position: relative;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      padding: 16px 50px;
      border-radius: 50px;
      font-size: 1.3em;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    `;
    
    // Button background layer for animation
    const btnBgLayer = document.createElement('div');
    btnBgLayer.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
      border-radius: inherit;
      animation: backgroundCycle 78s infinite ease-in-out;
    `;
    okBtn.appendChild(btnBgLayer);
    
    // Button hover effects
    okBtn.onmouseenter = () => {
      okBtn.style.transform = 'translateY(-3px)';
      okBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    };
    okBtn.onmouseleave = () => {
      okBtn.style.transform = '';
      okBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    };
    
    // Assemble
    content.appendChild(messageEl);
    content.appendChild(okBtn);
    toast.appendChild(content);
    document.body.appendChild(overlay);
    document.body.appendChild(toast);
    
    // Animate in after a micro-task (lets browser paint first)
    setTimeout(() => {
      overlay.style.opacity = '1';
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 0);
    
    // Close handler
    const close = () => {
      overlay.style.opacity = '0';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        overlay.remove();
        toast.remove();
      }, 400);
    };
    
    okBtn.onclick = close;
    overlay.onclick = close;
  }

  // ========================
  // WEATHER WIDGET – GLOBAL + FIXED RANDOM + CLEAR INPUT
  // ========================
  const WeatherWidget = {
    apiKey: '0e43eedf4557a8a6f0cd4a4a91d43751',
    limit: 7,

    init() {
      const weatherInfo = document.getElementById('weather-info');
      const geolocationBtn = document.getElementById('geolocation-btn');
      const cityInput = document.getElementById('city-input');
      const randomCityBtn = document.getElementById('random-city-btn');

      weatherInfo.innerHTML = '<p>Loading weather...</p>';
      this.getWeatherByGeolocation();

      geolocationBtn.addEventListener('click', () => {
        weatherInfo.innerHTML = '<p>Getting your location...</p>';
        this.getWeatherByGeolocation();
      });

      randomCityBtn.addEventListener('click', () => {
        weatherInfo.innerHTML = '<p>Finding a random city...</p>';
        this.getRandomCity();
      });

      // Clear input when user starts typing
      cityInput.addEventListener('focus', () => {
        cityInput.select();
      });

      // Autocomplete with debounce
      let debounceTimer;
      cityInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.showAutocomplete(cityInput.value.trim()), 300);
      });

      cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.getWeatherByCityName(cityInput.value.trim());
          this.clearAutocomplete();
        }
      });
    },

    async getWeatherByGeolocation() {
      if (!navigator.geolocation) {
        document.getElementById('weather-info').innerHTML = '<p>Geolocation not supported.</p>';
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await this.fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          document.getElementById('weather-info').innerHTML = '<p>Location denied. Type a city!</p>';
        }
      );
    },

    // FIXED: Uses API to get truly random cities from around the world
    async getRandomCity() {
      const randomQueries = [
        'london', 'paris', 'tokyo', 'new york', 'sydney', 'moscow', 'cairo', 
        'beijing', 'mumbai', 'dubai', 'singapore', 'rome', 'madrid', 'berlin',
        'bangkok', 'istanbul', 'toronto', 'mexico city', 'rio', 'seoul',
        'jakarta', 'delhi', 'manila', 'shanghai', 'karachi', 'buenos aires',
        'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'barcelona',
        'munich', 'amsterdam', 'stockholm', 'oslo', 'copenhagen', 'helsinki',
        'vienna', 'prague', 'budapest', 'warsaw', 'athens', 'lisbon', 'dublin'
      ];

      const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];
      
      try {
        const geo = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(randomQuery)}&limit=5&appid=${this.apiKey}`);
        const places = await geo.json();
        
        if (!places.length) {
          document.getElementById('weather-info').innerHTML = '<p>Could not find random city.</p>';
          return;
        }
        
        // Pick a random result from the returned cities
        const randomPlace = places[Math.floor(Math.random() * places.length)];
        const { lat, lon, name, country, state } = randomPlace;
        const displayName = state ? `${name}, ${state}, ${country}` : `${name}, ${country}`;
        
        document.getElementById('city-input').value = displayName;
        await this.fetchWeatherByCoords(lat, lon);
      } catch {
        document.getElementById('weather-info').innerHTML = '<p>Error finding random city.</p>';
      }
    },

    async getWeatherByCityName(query) {
      if (!query) {
        document.getElementById('weather-info').innerHTML = '<p>Please enter a city.</p>';
        return;
      }

      try {
        const geo = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`);
        const places = await geo.json();
        if (!places.length) {
          document.getElementById('weather-info').innerHTML = '<p>City not found.</p>';
          return;
        }
        const { lat, lon, name, country, state } = places[0];
        const displayName = state ? `${name}, ${state}, ${country}` : `${name}, ${country}`;
        document.getElementById('city-input').value = displayName;
        await this.fetchWeatherByCoords(lat, lon);
      } catch {
        document.getElementById('weather-info').innerHTML = '<p>Error searching city.</p>';
      }
    },

    async fetchWeatherByCoords(lat, lon) {
      const weatherInfo = document.getElementById('weather-info');
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`);
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message);

        const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        weatherInfo.innerHTML = `
          <p><strong>${data.name}, ${data.sys.country}</strong></p>
          <img src="${icon}" alt="${data.weather[0].description}" style="width:80px;">
          <p>${Math.round(data.main.temp)}°C — ${data.weather[0].description}</p>
          <p>Feels like ${Math.round(data.main.feels_like)}°C • Humidity ${data.main.humidity}%</p>
        `;
      } catch (err) {
        weatherInfo.innerHTML = `<p>Error: ${err.message}</p>`;
      }
    },

    async showAutocomplete(query) {
      if (query.length < 2) {
        this.clearAutocomplete();
        return;
      }

      let dropdown = document.querySelector('.autocomplete-suggestions');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-suggestions';
        document.getElementById('city-input').parentNode.appendChild(dropdown);
      }

      try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=${this.limit}&appid=${this.apiKey}`);
        const places = await res.json();

        dropdown.innerHTML = '';
        if (!places.length) {
          dropdown.style.display = 'none';
          return;
        }

        dropdown.style.display = 'block';
        places.forEach(place => {
          const item = document.createElement('div');
          item.className = 'autocomplete-suggestion';
          item.textContent = place.state
            ? `${place.name}, ${place.state}, ${place.country}`
            : `${place.name}, ${place.country}`;
          item.onclick = () => {
            document.getElementById('city-input').value = item.textContent;
            this.fetchWeatherByCoords(place.lat, place.lon);
            this.clearAutocomplete();
          };
          dropdown.appendChild(item);
        });
      } catch (e) {
        console.error('Autocomplete error:', e);
      }
    },

    clearAutocomplete() {
      const dropdown = document.querySelector('.autocomplete-suggestions');
      if (dropdown) dropdown.style.display = 'none';
    }
  };

  // ========================
  // MUSIC PLAYER (unchanged – perfect)
  // ========================
  const MusicPlayer = {
    widget: null,
    playlistUrl: 'https://soundcloud.com/chef-myklove-839927429/sets/chefmyklove',
    tracks: [],
    currentIndex: 0,
    isPlaying: false,
    isShuffled: false,
    shuffledIndices: [],

    init() {
      const tag = document.createElement('script');
      tag.src = 'https://w.soundcloud.com/player/api.js';
      tag.async = true;
      document.body.appendChild(tag);
      tag.onload = () => this.createPlayer();
      this.setupControls();
    },

    createPlayer() {
      const container = document.getElementById('soundcloud-player');
      const iframe = document.createElement('iframe');
      iframe.id = 'sc-widget';
      iframe.width = '100%';
      iframe.height = '166';
      iframe.scrolling = 'no';
      iframe.frameBorder = 'no';
      iframe.allow = 'autoplay';
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(this.playlistUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;

      container.innerHTML = '';
      container.appendChild(iframe);

      this.widget = SC.Widget(iframe);
      this.widget.bind(SC.Widget.Events.READY, () => this.onPlayerReady());
      this.widget.setVolume(50);
    },

    setupControls() {
      document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlayPause());
      document.getElementById('prev-btn')?.addEventListener('click', () => this.previousVideo());
      document.getElementById('next-btn')?.addEventListener('click', () => this.nextVideo());
      document.getElementById('shuffle-btn')?.addEventListener('click', () => this.toggleShuffle());
    },

    togglePlayPause() { this.widget?.isPaused(p => p ? this.widget.play() : this.widget.pause()); },
    previousVideo() { if (this.tracks.length) { this.currentIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length; this.widget.skip(this.isShuffled ? this.shuffledIndices[this.currentIndex] : this.currentIndex); this.widget.play(); } },
    nextVideo() { if (this.tracks.length) { this.currentIndex = (this.currentIndex + 1) % this.tracks.length; this.widget.skip(this.isShuffled ? this.shuffledIndices[this.currentIndex] : this.currentIndex); this.widget.play(); } },

    toggleShuffle() {
      if (!this.tracks.length) return;
      this.isShuffled = !this.isShuffled;
      const btn = document.getElementById('shuffle-btn');
      if (this.isShuffled) {
        this.shuffledIndices = [...Array(this.tracks.length).keys()].sort(() => Math.random() - 0.5);
        btn.style.background = 'rgba(102, 126, 234, 0.6)';
        btn.textContent = 'Shuffled';
      } else {
        this.shuffledIndices = [...Array(this.tracks.length).keys()];
        btn.style.background = '';
        btn.textContent = 'Shuffle';
      }
      this.currentIndex = 0;
    },

    updateCurrentTrack() {
      this.widget?.getCurrentSound(s => {
        if (s) {
          document.getElementById('current-track').textContent = s.title || 'Unknown';
          this.updateAlbumCover(s);
        }
      });
    },

    updateAlbumCover(s) {
      const img = document.getElementById('album-cover');
      if (s?.artwork_url) {
        img.src = s.artwork_url.replace('-large', '-t500x500');
      } else {
        img.src = 'https://i1.sndcdn.com/artworks-000282245234-1x1p5k-t500x500.jpg';
      }
      img.style.display = 'block';
    },

    updatePlayPauseButton() {
      const btn = document.getElementById('play-pause-btn');
      if (btn) btn.textContent = this.isPlaying ? 'Pause' : 'Play';
    },

    onPlayerReady() {
      this.widget.getSounds(s => {
        this.tracks = s;
        this.shuffledIndices = this.tracks.map((_, i) => i);
        document.getElementById('current-track').textContent = s.length ? 'Ready — Click Play' : 'Lofi Girl • 24/7 Live Radio';
        this.widget.getCurrentSound(s => this.updateAlbumCover(s));
      });

      this.widget.bind(SC.Widget.Events.PLAY, () => { this.isPlaying = true; this.updatePlayPauseButton(); this.updateCurrentTrack(); });
      this.widget.bind(SC.Widget.Events.PAUSE, () => { this.isPlaying = false; this.updatePlayPauseButton(); });
      this.widget.bind(SC.Widget.Events.FINISH, () => this.nextVideo());
    }
  };

  // ========================
  // CAROUSEL, ART CAROUSEL, EMAIL MODAL (unchanged)
  // ========================
  const Carousel = {
    init() {
      const carousel = document.querySelector('.carousel');
      const pauseBtn = document.getElementById('pause-carousel');
      const reverseBtn = document.getElementById('reverse-carousel');
      let paused = false, reversed = false;

      pauseBtn.addEventListener('click', () => {
        paused = !paused;
        carousel.style.animationPlayState = paused ? 'paused' : 'running';
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      });

      reverseBtn.addEventListener('click', () => {
        reversed = !reversed;
        carousel.style.animationDirection = reversed ? 'reverse' : 'normal';
        reverseBtn.textContent = reversed ? 'Forward' : 'Reverse';
      });
    }
  };

  const ArtCarousel = {
    init() {
      // PRINTIFY POP-UP STORE LINKS
      // Add your Printify product URLs from https://ordinalrainbows.printify.me/
      const artworks = [
        { 
          image: 'images/TunnelBow.JPEG', 
          printifyUrl: 'https://ordinalrainbows.printify.me/product/25134633/tunnelbow', // 
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
      let idx = 0;

      // Create clickable carousel items that open Printify store in modal
      artworks.forEach(artwork => {
        const div = document.createElement('div');
        div.className = 'art-carousel-item';
        
        // Only make clickable if Printify URL is set
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
          // No URL yet - just show image
          div.innerHTML = `
            <img src="${artwork.image}" 
                 alt="${artwork.alt}" 
                 title="${artwork.title}">
            <div class="art-carousel-coming-soon">Coming Soon</div>
          `;
        }
        
        inner.appendChild(div);
      });

      // Carousel navigation
      document.getElementById('art-carousel-prev').addEventListener('click', () => {
        if (idx > 0) { idx--; inner.style.transform = `translateX(-${idx * 33.33}%)`; }
      });

      document.getElementById('art-carousel-next').addEventListener('click', () => {
        if (idx < artworks.length - 3) { idx++; inner.style.transform = `translateX(-${idx * 33.33}%)`; }
      });
    }
  };

  // Printify Modal Handler
  function openPrintifyModal(url, title) {
    // Create modal
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
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Close handlers
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
    document.body.style.overflow = ''; // Restore scrolling
  }

  const EmailModal = {
    init() {
      const btn = document.getElementById('email-btn');
      const modal = document.getElementById('email-modal');
      const close = document.getElementById('close-modal');
      const form = document.getElementById('email-form');

      btn?.addEventListener('click', e => { e.preventDefault(); modal.style.display = 'flex'; });
      close?.addEventListener('click', () => modal.style.display = 'none');
      window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

      form?.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.querySelector('[name=email]').value.trim();
        const topic = form.querySelector('[name=topic]').value;
        const message = form.querySelector('[name=message]').value.trim();

        if (!email || !topic || !message || !/^\S+@\S+\.\S+$/.test(email)) {
          document.getElementById('form-error').style.display = 'block';
          return;
        }
        document.getElementById('form-error').style.display = 'none';

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Submit form - FormSpark will send confirmation regardless of response
        fetch('https://submit-form.com/1JnzAL7ST', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, topic, message, _replyto: email })
        }).catch(() => {}); // Ignore CORS redirect error
        
        // Show success immediately
        showNotification('🎉 Message sent! I\'ll reply soon. 🎉');
        modal.style.display = 'none';
        form.reset();
        
        // Re-enable button
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        }, 100);
      });
    }
  };

  // ===== MEMBERS-ONLY BLOG MODAL (safe to drop into existing project) =====
  (() => {
    // Bail if the elements don't exist yet (in case this script loads before the HTML)
    const openBtn = document.getElementById('openBlogModal');
    if (!openBtn) return;

    const modal = document.getElementById('blogModal');
    const closeBtn = modal.querySelector('.close');
    const loginBtn = document.getElementById('patreonLoginBtn');

    // Open
    openBtn.addEventListener('click', () => modal.style.display = 'flex');

    // Close with ×
    closeBtn?.addEventListener('click', () => modal.style.display = 'none');

    // Login with Patreon
    loginBtn?.addEventListener('click', () => {
      console.log('Patreon login clicked');
      const backendUrl = 'https://portfolio-and-blog-production.up.railway.app/auth/patreon';
      console.log('Redirecting to:', backendUrl);
      window.location.href = backendUrl;
    });

    // Close when clicking backdrop
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  })();

  // ========================
  // INITIALIZE
  // ========================
  WeatherWidget.init();
  MusicPlayer.init();
  Carousel.init();
  ArtCarousel.init();
  EmailModal.init();

  // ========================
  // LAZY LOAD BACKGROUND IMAGES
  // ========================
  // Preload animation images after page renders for faster initial load
  // HummingBow.jpg is already loaded in CSS, so we load the remaining 12
  const backgroundImages = [
    'images/IMG_6794.JPEG',
    'images/IMG_6795.JPEG',
    'images/IMG_6796.JPEG',
    'images/IMG_6797.JPEG',
    'images/TunnelBow.JPEG',
    'images/IMG_6906.JPEG',
    'images/IMG_6907.JPEG',
    'images/IMG_6908.JPEG',
    'images/IMG_6909.JPEG',
    'images/IMG_6910.JPEG',
    'images/IMG_6911.JPEG',
    'images/IMG_6912.JPEG'
  ];

  let loadedCount = 0;
  backgroundImages.forEach(src => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === backgroundImages.length) {
        // All images loaded - enable animated background
        document.body.classList.add('images-loaded');
      }
    };
    img.src = src;
  });
});
