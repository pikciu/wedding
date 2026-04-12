/**
 * Shared utility functions.
 * Pure helpers for HTML escaping, guest data, map iframes, and schedule icons.
 */

import { state } from './state.js';
import { decryptData as _decryptData } from './crypto.js';

export function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function decryptData(password) {
    return _decryptData(password, ENCRYPTED_DATA);
}

export function getGuestNames(guest) {
    if (!guest || !Array.isArray(guest.names)) return [];

    return guest.names.filter(function (item) {
        return typeof item === 'string' && item.trim();
    });
}

export function formatGuestNamesHtml(names) {
    if (!Array.isArray(names) || names.length === 0) return '';

    return names.map(function (name) {
        return escapeHtml(name);
    }).join(' <span>&</span> ');
}

export function getPersonName(person) {
    if (person && typeof person === 'object' && typeof person.name === 'string') {
        return person.name;
    }
    if (typeof person === 'string') return person;
    return '';
}

export function getCurrentGuest(data) {
    if (!state.currentGuestKey || !data || !data.guests || !data.guests[state.currentGuestKey]) {
        return null;
    }
    return data.guests[state.currentGuestKey];
}

export function createMapIframe(src) {
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '100%';
    iframe.height = '200';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    return iframe;
}

export function getScheduleIconHtml(iconFile) {
    if (typeof iconFile !== 'string') return '';

    // Allow only simple file names like "church.svg" to avoid invalid src injection.
    var safeIconFile = iconFile.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*\.svg$/.test(safeIconFile)) return '';

    var altText = safeIconFile.replace('.svg', '').replace(/-/g, ' ');
    return '<img src="images/icons/' + safeIconFile + '" alt="' + escapeHtml(altText) + '" class="icon-img" width="24" height="24">';
}
