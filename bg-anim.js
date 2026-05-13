(function () {
    var BASE = (typeof window.BG_BASE_PATH !== 'undefined') ? window.BG_BASE_PATH : 'images/';

    var BG_IMAGES = [
        BASE + 'HummingBow.jpg',
        BASE + 'IMG_6794.JPEG',
        BASE + 'IMG_6795.JPEG',
        BASE + 'IMG_6796.JPEG',
        BASE + 'IMG_6797.JPEG',
        BASE + 'TunnelBow.JPEG',
        BASE + 'IMG_6906.JPEG',
        BASE + 'IMG_6907.JPEG',
        BASE + 'IMG_6908.JPEG',
        BASE + 'IMG_6909.JPEG',
        BASE + 'IMG_6910.JPEG',
        BASE + 'IMG_6911.JPEG',
        BASE + 'IMG_6912.JPEG'
    ];

    var cloudAnimT = 0;

    function startCloudAnim() {
        var turb  = document.getElementById('cloud-turb');
        var turb2 = document.getElementById('cloud-turb-b');
        if (!turb) return;

        function tick() {
            cloudAnimT += 0.00065;
            var fx  = 0.009 + Math.sin(cloudAnimT * 1.10) * 0.012 + Math.sin(cloudAnimT * 2.30) * 0.006;
            var fy  = 0.011 + Math.cos(cloudAnimT * 0.75) * 0.011 + Math.cos(cloudAnimT * 1.90) * 0.006;
            turb.setAttribute('baseFrequency', fx.toFixed(5) + ' ' + fy.toFixed(5));
            if (turb2) {
                var fx2 = 0.010 + Math.sin(cloudAnimT * 0.85 + 2.10) * 0.012 + Math.sin(cloudAnimT * 1.70) * 0.006;
                var fy2 = 0.009 + Math.cos(cloudAnimT * 0.60 + 1.50) * 0.011 + Math.cos(cloudAnimT * 1.50) * 0.006;
                turb2.setAttribute('baseFrequency', fx2.toFixed(5) + ' ' + fy2.toFixed(5));
            }
            requestAnimationFrame(tick);
        }
        tick();
    }

    function initBackgroundCycle() {
        var FADE_MS = 9000;
        var HOLD_MS = 4000;
        var N = BG_IMAGES.length;

        var bgBot = document.getElementById('bgLayerA');
        var bgTop = document.getElementById('bgLayerB');
        var c1Bot = document.getElementById('cloud1A');
        var c1Top = document.getElementById('cloud1B');
        var c2Bot = document.getElementById('cloud2A');
        var c2Top = document.getElementById('cloud2B');
        if (!c1Bot || !c1Top) return;

        BG_IMAGES.forEach(function (src) { var img = new Image(); img.src = src; });

        [bgBot, bgTop].forEach(function (el) {
            if (el) { el.style.transition = 'none'; el.style.opacity = '0'; }
        });
        [c1Bot, c1Top, c2Bot, c2Top].filter(Boolean).forEach(function (el) {
            el.style.transition = 'none';
        });

        var topSrc = BG_IMAGES[1];
        var topIdx = 1;

        function setImg(el, src) { if (el) el.style.backgroundImage = "url('" + src + "')"; }
        function setOp(els, v) {
            var s = v.toFixed(4);
            els.forEach(function (el) { if (el) el.style.opacity = s; });
        }

        var botEls = [c1Bot, c2Bot].filter(Boolean);
        var topEls = [c1Top, c2Top].filter(Boolean);

        function applyBot(src) { botEls.forEach(function (el) { setImg(el, src); }); }
        function applyTop(src) { topSrc = src; topEls.forEach(function (el) { setImg(el, src); }); }

        applyBot(BG_IMAGES[0]);
        applyTop(BG_IMAGES[1]);
        setOp(botEls, 1.0);
        setOp(topEls, 0.0);

        var phase = 'hold';
        var phaseStart = null;

        function tick(ts) {
            if (!phaseStart) phaseStart = ts;

            if (phase === 'hold') {
                if (ts - phaseStart >= HOLD_MS) {
                    phase = 'crossfade';
                    phaseStart = ts;
                }
            } else {
                var f = Math.min((ts - phaseStart) / FADE_MS, 1.0);
                setOp(botEls, Math.cos(f * Math.PI / 2));
                setOp(topEls, Math.sin(f * Math.PI / 2));

                if (f >= 1.0) {
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

    function init() {
        startCloudAnim();
        initBackgroundCycle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
