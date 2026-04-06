/**
 * Wedding Website JavaScript
 * Handles: Page Population, Navigation, Scroll Animations
 * Crypto logic lives in crypto.js (shared with invitation.js)
 */

// ===================================
// Configuration (populated after decryption)
// ===================================
const CONFIG = {
    animationThreshold: 0.2,
    scrollOffset: 100
};

// ===================================
// i18n — Internationalization
// ===================================
var translations = null;
var currentLang = localStorage.getItem('weddingLang') || 'pl';
var currentData = null;

function t(field) {
    if (field && typeof field === 'object' && field[currentLang] !== undefined) {
        return field[currentLang];
    }
    return field;
}

async function loadTranslations() {
    if (translations) return translations;
    var resp = await fetch('data/translations.json');
    translations = await resp.json();
    return translations;
}

function applyTranslations() {
    if (!translations) return;
    var strings = translations[currentLang];
    if (!strings) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (strings[key] !== undefined) el.textContent = strings[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-html');
        if (strings[key] !== undefined) el.innerHTML = strings[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (strings[key] !== undefined) el.placeholder = strings[key];
    });

    document.documentElement.lang = currentLang === 'ua' ? 'uk' : 'pl';
}

function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
}

function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('weddingLang', lang);
    applyTranslations();
    updateLangButtons();
    if (currentData) {
        repopulatePage(currentData);
    }
}

function initLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            switchLanguage(btn.getAttribute('data-lang'));
        });
    });
    updateLangButtons();
}

// ===================================
// Schedule Icons (from data JSON)
// ===================================
function getScheduleIconHtml(iconFile) {
    if (typeof iconFile !== 'string') return '';

    // Allow only simple file names like "church.svg" to avoid invalid src injection.
    var safeIconFile = iconFile.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*\.svg$/.test(safeIconFile)) return '';

    var altText = safeIconFile.replace('.svg', '').replace(/-/g, ' ');
    return '<img src="images/icons/' + safeIconFile + '" alt="' + escapeHtml(altText) + '" class="icon-img" width="24" height="24">';
}

// ===================================
// FAQ Rendering
// ===================================
function renderFaqAnswer(text) {
    var lines = text.split('\n');
    var html = '';
    var listItems = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('- ') === 0) {
            listItems.push('<li>' + escapeHtml(line.substring(2)) + '</li>');
        } else {
            if (listItems.length > 0) {
                html += '<ul>' + listItems.join('') + '</ul>';
                listItems = [];
            }
            if (line.trim()) {
                html += '<p>' + escapeHtml(line) + '</p>';
            }
        }
    }
    if (listItems.length > 0) {
        html += '<ul>' + listItems.join('') + '</ul>';
    }
    return html;
}

function renderFaq(data) {
    if (!data.faq) return;
    var container = document.getElementById('faq-container');
    container.innerHTML = data.faq.map(function (item) {
        return '<div class="faq-item">' +
            '<div class="faq-question">' + escapeHtml(t(item.question)) + '</div>' +
            '<div class="faq-answer"><div class="faq-answer-inner">' +
            renderFaqAnswer(t(item.answer)) +
            '</div></div></div>';
    }).join('');
}

function initFaqAccordion() {
    var container = document.getElementById('faq-container');
    if (!container) return;
    container.addEventListener('click', function (e) {
        var question = e.target.closest('.faq-question');
        if (!question) return;
        var item = question.parentElement;
        var answer = item.querySelector('.faq-answer');

        // Close other open items
        container.querySelectorAll('.faq-item.open').forEach(function (openItem) {
            if (openItem !== item) {
                openItem.classList.remove('open');
                openItem.querySelector('.faq-answer').style.maxHeight = null;
            }
        });

        // Toggle current
        if (item.classList.contains('open')) {
            item.classList.remove('open');
            answer.style.maxHeight = null;
        } else {
            item.classList.add('open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
}

// ===================================
// Utility shorthand (delegates to CryptoUtils)
// ===================================
function escapeHtml(str) {
    return CryptoUtils.escapeHtml(str);
}

function decryptData(password) {
    return CryptoUtils.decryptData(password, ENCRYPTED_DATA);
}

// ===================================
// Map Iframe Builder
// ===================================
function createMapIframe(src) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '200';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    return iframe;
}

// ===================================
// Page Population
// ===================================
function populatePage(data) {
    currentData = data;

    // Page meta
    document.title = t(data.pageTitle);
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t(data.pageDescription);

    // Navigation
    document.getElementById('nav-logo').textContent = data.navLogo;

    // Hero
    document.getElementById('hero-title').innerHTML =
        escapeHtml(data.bride) + ' <span>&</span> ' + escapeHtml(data.groom);
    document.getElementById('hero-date').textContent = t(data.weddingDateDisplay);

    // Ceremony
    document.getElementById('ceremony-name').textContent = data.ceremony.name;
    document.getElementById('ceremony-address').textContent = data.ceremony.address;
    document.getElementById('ceremony-time').textContent = t(data.ceremony.timeDisplay);
    document.getElementById('ceremony-nav').href = data.ceremony.mapNav;
    document.getElementById('ceremony-map-container').appendChild(
        createMapIframe(data.ceremony.mapEmbed)
    );

    // Venue
    document.getElementById('venue-name').textContent = data.venue.name;
    document.getElementById('venue-address').textContent = data.venue.address;
    document.getElementById('venue-time').textContent = t(data.venue.timeDisplay);
    document.getElementById('venue-nav').href = data.venue.mapNav;
    document.getElementById('venue-map-container').appendChild(
        createMapIframe(data.venue.mapEmbed)
    );

    // Schedule
    var timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = data.schedule.map(function (item) {
        return '<div class="timeline-item animate-on-scroll">' +
            '<div class="timeline-time">' + escapeHtml(item.time) + '</div>' +
            '<div class="timeline-content card">' +
            '<div class="timeline-icon icon-circle">' + getScheduleIconHtml(item.icon) + '</div>' +
            '<h3>' + escapeHtml(t(item.title)) + '</h3>' +
            '<p>' + escapeHtml(t(item.description)) + '</p>' +
            '</div></div>';
    }).join('');

    // Hotel
    var hotelTitlePrefix = translations ? translations[currentLang]['accommodation.hotelTitle'] : 'Accommodation';
    document.getElementById('hotel-title').textContent = hotelTitlePrefix + ' — ' + data.hotel.name;
    document.getElementById('hotel-address').textContent = data.hotel.address;
    document.getElementById('hotel-website-link').href = data.hotel.website;
    document.getElementById('hotel-map-link').href = data.hotel.mapLink;
    document.getElementById('hotel-nav-link').href = data.hotel.navLink;
    document.getElementById('hotel-reservation-note').textContent = t(data.hotel.reservationNote);
    document.getElementById('hotel-checkin').textContent = t(data.hotel.checkInInfo);
    document.getElementById('hotel-breakfast').textContent = t(data.hotel.breakfastInfo);

    // Transport
    var transportList = document.getElementById('transport-list');
    transportList.innerHTML = data.transport.map(function (item) {
        return '<li>' +
            '<span class="transport-time">' + escapeHtml(item.time) + '</span>' +
            '<span class="transport-route">' + escapeHtml(t(item.route)) + '</span>' +
            '</li>';
    }).join('');

    // Album
    document.getElementById('album-link-google').href = data.album.googleLink;
    var sms = data.album.icloudSms;
    var smsHref = 'sms:' + sms.number + '?body=' + encodeURIComponent(t(sms.body));
    document.getElementById('album-link-icloud-sms').href = smsHref;

    // FAQ
    renderFaq(data);

    // Footer
    document.getElementById('footer-names').textContent = data.bride + ' & ' + data.groom;
    document.getElementById('footer-date').textContent = t(data.weddingDateDisplay);

}

// ===================================
// Repopulate (language switch after initial load)
// ===================================
function repopulatePage(data) {
    // Page meta
    document.title = t(data.pageTitle);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t(data.pageDescription);

    // Hero date
    document.getElementById('hero-date').textContent = t(data.weddingDateDisplay);

    // Ceremony & Venue times
    document.getElementById('ceremony-time').textContent = t(data.ceremony.timeDisplay);
    document.getElementById('venue-time').textContent = t(data.venue.timeDisplay);

    // Schedule (regenerate)
    var timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = data.schedule.map(function (item) {
        return '<div class="timeline-item animate-on-scroll visible">' +
            '<div class="timeline-time">' + escapeHtml(item.time) + '</div>' +
            '<div class="timeline-content card">' +
            '<div class="timeline-icon icon-circle">' + getScheduleIconHtml(item.icon) + '</div>' +
            '<h3>' + escapeHtml(t(item.title)) + '</h3>' +
            '<p>' + escapeHtml(t(item.description)) + '</p>' +
            '</div></div>';
    }).join('');

    // Hotel
    var hotelTitlePrefix = translations ? translations[currentLang]['accommodation.hotelTitle'] : 'Accommodation';
    document.getElementById('hotel-title').textContent = hotelTitlePrefix + ' — ' + data.hotel.name;
    document.getElementById('hotel-reservation-note').textContent = t(data.hotel.reservationNote);
    document.getElementById('hotel-checkin').textContent = t(data.hotel.checkInInfo);
    document.getElementById('hotel-breakfast').textContent = t(data.hotel.breakfastInfo);

    // Transport (regenerate)
    var transportList = document.getElementById('transport-list');
    transportList.innerHTML = data.transport.map(function (item) {
        return '<li>' +
            '<span class="transport-time">' + escapeHtml(item.time) + '</span>' +
            '<span class="transport-route">' + escapeHtml(t(item.route)) + '</span>' +
            '</li>';
    }).join('');

    // Footer date
    document.getElementById('footer-date').textContent = t(data.weddingDateDisplay);

    // FAQ
    renderFaq(data);
}

// ===================================
// Lock Screen
// ===================================
function showLockScreen() {
    document.getElementById('lock-screen').style.display = '';
    document.getElementById('password-input').focus();
}

function hideLockScreen() {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('app-content').classList.remove('app-content--hidden');
}

function showError(message) {
    var errorEl = document.getElementById('lock-screen-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// ===================================
// Navigation
// ===================================
function initNavigation() {
    var nav = document.getElementById('nav');
    var navToggle = document.getElementById('nav-toggle');
    var navMenu = document.getElementById('nav-menu');

    function updateNavScrolledState() {
        if (window.pageYOffset > CONFIG.scrollOffset) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavScrolledState);
    window.addEventListener('resize', updateNavScrolledState);
    updateNavScrolledState();

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
    }

    document.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            navMenu.classList.remove('open');
            if (navToggle) navToggle.classList.remove('open');
        });
    });

    document.addEventListener('click', function (e) {
        if (navMenu.classList.contains('open') &&
            !navMenu.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var headerOffset = nav.offsetHeight;
                var elementPosition = target.getBoundingClientRect().top;
                var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
}

// ===================================
// Scroll Animations
// ===================================
function initScrollAnimations() {
    var animatedElements = document.querySelectorAll('.animate-on-scroll');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: CONFIG.animationThreshold,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(function (el) { observer.observe(el); });
}

// ===================================
// QR Code Generation (Optional)
// ===================================
function generateQRCode() {
    var googleQr = document.getElementById('qr-code-google');
    var icloudQr = document.getElementById('qr-code-icloud');
    var googleLink = document.getElementById('album-link-google');
    var icloudSmsLink = document.getElementById('album-link-icloud-sms');

    var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=';

    if (googleQr && googleLink && googleLink.href && googleLink.href !== '#') {
        googleQr.innerHTML = '<img src="' + qrApi + encodeURIComponent(googleLink.href) + '" alt="QR Android">';
    }
    if (icloudQr && icloudSmsLink && icloudSmsLink.href && icloudSmsLink.href !== '#') {
        icloudQr.innerHTML = '<img src="' + qrApi + encodeURIComponent(icloudSmsLink.href) + '" alt="QR Apple">';
    }
}

// ===================================
// Active Navigation Link
// ===================================
function initActiveNavigation() {
    var sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function () {
        var current = '';
        sections.forEach(function (section) {
            if (window.pageYOffset >= section.offsetTop - 200) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// ===================================
// App Initialization
// ===================================
function onDecryptSuccess(data, password) {
    populatePage(data);
    applyTranslations();
    hideLockScreen();

    // Cache password for future visits
    localStorage.setItem('weddingPassword', password);

    // Remove hash from URL (prevent password leaking in screenshots)
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Start features
    initNavigation();
    initScrollAnimations();
    initActiveNavigation();
    generateQRCode();
    initFaqAccordion();
}

function setupPasswordForm() {
    var form = document.getElementById('password-form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var input = document.getElementById('password-input');
        var password = input.value;

        if (!password) return;

        try {
            var data = await decryptData(password);
            onDecryptSuccess(data, password);
        } catch (err) {
            showError(translations ? translations[currentLang]['lockScreen.error'] : 'Nieprawid\u0142owe has\u0142o. Spr\u00f3buj ponownie.');
            input.value = '';
            input.focus();
        }
    });
}

async function initApp() {
    // Load translations first (needed for lock screen)
    await loadTranslations();
    applyTranslations();
    initLangSwitcher();

    // Check for encrypted data
    if (!ENCRYPTED_DATA) {
        showError(translations[currentLang]['error.noData']);
        showLockScreen();
        return;
    }

    // Try password from: 1) URL hash, 2) localStorage
    var password = null;

    var hash = window.location.hash;
    if (hash && hash.length > 1) {
        password = decodeURIComponent(hash.substring(1));
        // Some services insert a slash before the hash value (e.g. /#haslo)
        if (password.charAt(0) === '/') {
            password = password.substring(1) || null;
        }
    }

    if (!password) {
        password = localStorage.getItem('weddingPassword');
    }

    if (password) {
        try {
            var data = await decryptData(password);
            onDecryptSuccess(data, password);
            return;
        } catch (err) {
            // Invalid cached/URL password — clear and show form
            localStorage.removeItem('weddingPassword');
        }
    }

    // No valid password found — show lock screen
    showLockScreen();
    setupPasswordForm();
}

document.addEventListener('DOMContentLoaded', initApp);
