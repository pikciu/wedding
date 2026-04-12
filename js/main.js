/**
 * Wedding Website — App Entry Point
 * Orchestrates initialization, lock screen, and decryption flow.
 * Module-level logic lives in dedicated files under js/.
 */

import { state } from './state.js';
import { loadTranslations, applyTranslations, initLangSwitcher, setLanguageChangeCallback } from './i18n.js';
import { decryptData } from './utils.js';
import { initRsvpForm } from './rsvp.js';
import { initFaqAccordion } from './faq.js';
import { initNavigation, initScrollAnimations, initActiveNavigation } from './navigation.js';
import { populatePage, repopulatePage, generateQRCode } from './render.js';

// Wire language-change callback to re-render the page
setLanguageChangeCallback(repopulatePage);

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
// App Initialization
// ===================================
function onDecryptSuccess(data, password, guestKey) {
    var normalizedGuestKey = typeof guestKey === 'string' ? guestKey.trim() : '';
    state.currentGuestKey = normalizedGuestKey || null;
    populatePage(data);
    applyTranslations();
    hideLockScreen();

    // Cache password and guest key for future visits
    localStorage.setItem('weddingPassword', password);
    if (state.currentGuestKey) {
        localStorage.setItem('weddingGuestKey', state.currentGuestKey);
    } else {
        localStorage.removeItem('weddingGuestKey');
    }

    // Remove only hash from URL (prevent password leaking in screenshots)
    // Keep query params so switching guest links is easier.
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Start features
    initNavigation();
    initScrollAnimations();
    initActiveNavigation();
    generateQRCode();
    initFaqAccordion();
    initRsvpForm();
}

function setupPasswordForm() {
    var form = document.getElementById('password-form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var input = document.getElementById('password-input');
        var guestInput = document.getElementById('guest-code-input');
        var password = input.value;
        var guestKey = guestInput.value.trim() || null;

        if (!password) return;

        try {
            var data = await decryptData(password);
            onDecryptSuccess(data, password, guestKey);
        } catch (err) {
            showError(state.translations ? state.translations[state.currentLang]['lockScreen.error'] : 'Nieprawid\u0142owe has\u0142o. Spr\u00f3buj ponownie.');
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
    if (typeof ENCRYPTED_DATA === 'undefined' || !ENCRYPTED_DATA) {
        console.log('Brak ENCRYPTED_DATA. Wygeneruj dane: node scripts/encrypt.js');
        showLockScreen();
        return;
    }

    // Try guest key from: 1) URL query param ?g= (strict priority), 2) localStorage fallback
    var guestKey = null;
    var urlParams = new URLSearchParams(window.location.search);
    var hasGuestKeyInUrl = urlParams.has('g');
    if (hasGuestKeyInUrl) {
        guestKey = (urlParams.get('g') || '').trim() || null;
    } else {
        var cachedGuestKey = localStorage.getItem('weddingGuestKey');
        guestKey = cachedGuestKey ? cachedGuestKey.trim() || null : null;
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
            onDecryptSuccess(data, password, guestKey);
            return;
        } catch (err) {
            // Invalid cached/URL password — clear and show form
            localStorage.removeItem('weddingPassword');
        }
    }

    // No valid password found — show lock screen
    showLockScreen();
    var guestInput = document.getElementById('guest-code-input');
    if (guestInput && guestKey) {
        guestInput.value = guestKey;
    }
    setupPasswordForm();
}

document.addEventListener('DOMContentLoaded', initApp);
