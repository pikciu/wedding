/**
 * Internationalization (i18n) module.
 * Language detection, switching, translation loading and applying.
 */

import { state } from './state.js';

var _onLanguageChange = null;

/**
 * Register a callback invoked after language switch (receives currentData).
 * Used by main.js to wire repopulatePage without circular imports.
 */
export function setLanguageChangeCallback(cb) {
    _onLanguageChange = cb;
}

export function normalizeLangCode(lang) {
    if (typeof lang !== 'string') return null;

    var code = lang.trim().toLowerCase();
    if (!code) return null;

    if (code.indexOf('pl') === 0) return 'pl';
    if (code.indexOf('uk') === 0 || code.indexOf('ua') === 0) return 'ua';

    return null;
}

function detectBrowserLanguage() {
    if (Array.isArray(navigator.languages)) {
        for (var i = 0; i < navigator.languages.length; i++) {
            var normalized = normalizeLangCode(navigator.languages[i]);
            if (normalized) return normalized;
        }
    }

    return normalizeLangCode(navigator.language);
}

export function resolveInitialLanguage() {
    var savedLang = normalizeLangCode(localStorage.getItem('weddingLang'));
    if (savedLang) return savedLang;

    var browserLang = detectBrowserLanguage();
    if (browserLang) return browserLang;

    return 'pl';
}

// Set initial language when module loads
state.currentLang = resolveInitialLanguage();

export function t(field) {
    if (field && typeof field === 'object' && field[state.currentLang] !== undefined) {
        return field[state.currentLang];
    }
    return field;
}

export async function loadTranslations() {
    if (state.translations) return state.translations;
    var resp = await fetch('data/translations.json');
    state.translations = await resp.json();
    return state.translations;
}

export function applyTranslations() {
    if (!state.translations) return;
    var strings = state.translations[state.currentLang];
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

    document.documentElement.lang = state.currentLang === 'ua' ? 'uk' : 'pl';
}

function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === state.currentLang);
    });
}

export function switchLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem('weddingLang', lang);
    applyTranslations();
    updateLangButtons();
    if (_onLanguageChange && state.currentData) {
        _onLanguageChange(state.currentData);
    }
}

export function initLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            switchLanguage(btn.getAttribute('data-lang'));
        });
    });
    updateLangButtons();
}
