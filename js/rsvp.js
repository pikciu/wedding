/**
 * RSVP section — rendering, form handling, and submission.
 */

import { state } from './state.js';
import { t } from './i18n.js';
import { getPersonName, getGuestNames, getCurrentGuest, formatGuestNamesHtml } from './utils.js';

function formatRsvpDeadline(deadlineIso) {
    var date = new Date(deadlineIso);
    if (Number.isNaN(date.getTime())) return '';
    var locale = state.currentLang === 'ua' ? 'uk-UA' : 'pl-PL';
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function getRsvpStorageKey() {
    return state.currentGuestKey ? 'rsvpSubmitted:' + state.currentGuestKey : 'rsvpSubmitted:anonymous';
}

function setRsvpStatus(key, tone) {
    var statusEl = document.getElementById('rsvp-status');
    if (!statusEl || !state.translations || !state.translations[state.currentLang]) return;
    statusEl.textContent = state.translations[state.currentLang][key] || '';
    statusEl.className = 'rsvp-status';
    if (tone) statusEl.classList.add('rsvp-status--' + tone);
}

function showRsvpConfirmed(data) {
    var confirmed = document.getElementById('rsvp-confirmed');
    var form = document.getElementById('rsvp-form');
    var strings = state.translations ? state.translations[state.currentLang] : {};
    if (!confirmed) return;

    if (form) form.style.display = 'none';

    var titleEl = document.getElementById('rsvp-confirmed-title');
    var msgEl = document.getElementById('rsvp-confirmed-message');
    var contactsEl = document.getElementById('rsvp-confirmed-contacts');

    if (titleEl) titleEl.textContent = strings['rsvp.confirmedTitle'] || '';
    if (msgEl) msgEl.textContent = strings['rsvp.confirmedMessage'] || '';

    if (contactsEl && data) {
        contactsEl.innerHTML = '';
        var people = [
            { name: getPersonName(data.bride), phone: data.bride && data.bride.phone },
            { name: getPersonName(data.groom), phone: data.groom && data.groom.phone }
        ];
        people.forEach(function (p) {
            if (!p.phone) return;
            var link = document.createElement('a');
            link.href = 'tel:' + p.phone.replace(/\s/g, '');
            link.className = 'rsvp-confirmed__contact';
            var nameSpan = document.createElement('span');
            nameSpan.className = 'rsvp-confirmed__contact-name';
            nameSpan.textContent = p.name;
            var phoneSpan = document.createElement('span');
            phoneSpan.className = 'rsvp-confirmed__contact-phone';
            phoneSpan.textContent = p.phone;
            link.appendChild(nameSpan);
            link.appendChild(phoneSpan);
            contactsEl.appendChild(link);
        });
    }

    confirmed.style.display = 'flex';
    confirmed.classList.add('visible');
}

export function renderRsvp(data) {
    var section = document.getElementById('rsvp');
    var navRsvp = document.querySelector('a[href="#rsvp"]');
    var guest = getCurrentGuest(data);

    if (!guest) {
        if (section) section.style.display = 'none';
        if (navRsvp) navRsvp.closest('li').style.display = 'none';
        var heroScroll = document.querySelector('.hero-scroll');
        if (heroScroll) heroScroll.href = '#locations';
        return;
    }

    var subtitleEl = document.getElementById('rsvp-subtitle');
    var strings = state.translations ? state.translations[state.currentLang] : {};
    var form = document.getElementById('rsvp-form');

    if (subtitleEl && data.rsvpDeadline) {
        var deadlineDate = formatRsvpDeadline(data.rsvpDeadline);
        var subtitleTemplate = strings['rsvp.subtitle'] || '';
        subtitleEl.textContent = subtitleTemplate.replace('{date}', deadlineDate);
    }

    if (localStorage.getItem(getRsvpStorageKey()) === '1') {
        if (form) form.style.display = 'none';
        showRsvpConfirmed(data);
    }
}

async function submitRsvp(url, payload) {
    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
        body.append(key, payload[key]);
    });
    await fetch(url, { method: 'POST', mode: 'no-cors', body: body });
}

export function initRsvpForm() {
    var form = document.getElementById('rsvp-form');
    if (!form || form.dataset.ready === '1') return;

    var options = form.querySelectorAll('.rsvp-option');
    var hiddenInput = document.getElementById('rsvp-attendance');

    options.forEach(function (btn) {
        btn.addEventListener('click', function () {
            options.forEach(function (b) { b.classList.remove('rsvp-option--active'); });
            btn.classList.add('rsvp-option--active');
            if (hiddenInput) hiddenInput.value = btn.dataset.value;
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!state.currentData || !state.currentGuestKey) {
            setRsvpStatus('rsvp.missingGuestCode', 'error');
            return;
        }

        var attendance = hiddenInput ? hiddenInput.value : '';
        if (!attendance) {
            setRsvpStatus('rsvp.selectOption', 'error');
            return;
        }

        var guest = getCurrentGuest(state.currentData);
        var names = getGuestNames(guest);
        var honeypot = form.elements.website ? form.elements.website.value : '';
        var submitBtn = document.getElementById('rsvp-submit');

        if (submitBtn) submitBtn.disabled = true;

        try {
            await submitRsvp(state.currentData.rsvpUrl, {
                guestCode: state.currentGuestKey,
                names: names.join(', '),
                attendance: attendance,
                lang: state.currentLang,
                website: honeypot
            });

            localStorage.setItem(getRsvpStorageKey(), '1');
            showRsvpConfirmed(state.currentData);
        } catch (err) {
            if (submitBtn) submitBtn.disabled = false;
            setRsvpStatus('rsvp.submitError', 'error');
        }
    });

    form.dataset.ready = '1';
}
