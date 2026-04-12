/**
 * Page rendering — hero, populatePage, repopulatePage, QR codes.
 */

import { state } from './state.js';
import { t } from './i18n.js';
import { escapeHtml, getPersonName, getCurrentGuest, getGuestNames, formatGuestNamesHtml, createMapIframe, getScheduleIconHtml } from './utils.js';
import { renderRsvp } from './rsvp.js';
import { renderFaq } from './faq.js';

export function renderHeroInvitation(data) {
    var guest = getCurrentGuest(data);

    var inviteTextEl = document.getElementById('hero-invite-text');
    var guestNameEl = document.getElementById('hero-guest-name');
    var partnerTextEl = document.getElementById('hero-partner-text');
    var dateEl = document.getElementById('hero-date');
    var strings = state.translations ? state.translations[state.currentLang] : {};
    var guestNames = getGuestNames(guest);
    var partnerText = null;

    if (guest && typeof guest.partner === 'string') {
        partnerText = guest.partner.trim() || null;
    }

    if (guest && guestNames.length > 0) {
        inviteTextEl.textContent = strings['hero.joyfullyInvite'] || 'z radością zapraszają';
        inviteTextEl.style.display = '';
        guestNameEl.innerHTML = formatGuestNamesHtml(guestNames);
        guestNameEl.style.display = '';
        if (partnerText) {
            partnerTextEl.textContent = partnerText;
            partnerTextEl.style.display = '';
        } else {
            partnerTextEl.textContent = '';
            partnerTextEl.style.display = 'none';
        }
        dateEl.textContent = (strings['hero.toTheCeremony'] || 'na uroczystość zawarcia związku małżeńskiego') +
            '\n' + t(data.weddingDateDisplay);
    } else {
        inviteTextEl.textContent = '';
        inviteTextEl.style.display = 'none';
        guestNameEl.textContent = '';
        guestNameEl.style.display = 'none';
        partnerTextEl.textContent = '';
        partnerTextEl.style.display = 'none';
        dateEl.textContent = t(data.weddingDateDisplay);
    }
}

function renderTimeline(data, visible) {
    var extraClass = visible ? ' visible' : '';
    var timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = data.schedule.map(function (item) {
        return '<div class="timeline-item animate-on-scroll' + extraClass + '">' +
            '<div class="timeline-time">' + escapeHtml(item.time) + '</div>' +
            '<div class="timeline-content card">' +
            '<div class="timeline-icon icon-circle">' + getScheduleIconHtml(item.icon) + '</div>' +
            '<h3>' + escapeHtml(t(item.title)) + '</h3>' +
            '<p>' + escapeHtml(t(item.description)) + '</p>' +
            '</div></div>';
    }).join('');
}

function renderTransport(data) {
    var transportList = document.getElementById('transport-list');
    transportList.innerHTML = data.transport.map(function (item) {
        return '<li>' +
            '<span class="transport-time">' + escapeHtml(item.time) + '</span>' +
            '<span class="transport-route">' + escapeHtml(t(item.route)) + '</span>' +
            '</li>';
    }).join('');
}

function renderHotel(data) {
    var hotelTitlePrefix = state.translations ? state.translations[state.currentLang]['accommodation.hotelTitle'] : 'Accommodation';
    document.getElementById('hotel-title').textContent = hotelTitlePrefix + ' — ' + data.hotel.name;
    document.getElementById('hotel-address').textContent = data.hotel.address;
    document.getElementById('hotel-website-link').href = data.hotel.website;
    document.getElementById('hotel-map-link').href = data.hotel.mapLink;
    document.getElementById('hotel-nav-link').href = data.hotel.navLink;
    document.getElementById('hotel-reservation-note').textContent = t(data.hotel.reservationNote);
    document.getElementById('hotel-checkin').textContent = t(data.hotel.checkInInfo);
    document.getElementById('hotel-breakfast').textContent = t(data.hotel.breakfastInfo);
}

function renderAlbumLinks(data) {
    document.getElementById('album-link-google').href = data.album.googleLink;
    var sms = data.album.icloudSms;
    var smsHref = 'sms:' + sms.number + '?body=' + encodeURIComponent(t(sms.body));
    document.getElementById('album-link-icloud-sms').href = smsHref;
}

function renderFooter(data) {
    var brideName = getPersonName(data.bride);
    var groomName = getPersonName(data.groom);
    document.getElementById('footer-names').textContent = brideName + ' & ' + groomName;
    document.getElementById('footer-date').textContent = t(data.weddingDateDisplay);
}

export function populatePage(data) {
    state.currentData = data;

    // Page meta
    document.title = t(data.pageTitle);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t(data.pageDescription);

    // Navigation
    document.getElementById('nav-logo').textContent = data.navLogo;

    // Hero
    var brideName = getPersonName(data.bride);
    var groomName = getPersonName(data.groom);
    document.getElementById('hero-title').innerHTML =
        escapeHtml(brideName) + ' <span>&</span> ' + escapeHtml(groomName);
    renderHeroInvitation(data);
    renderRsvp(data);

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

    // Schedule, Hotel, Transport, Album, FAQ, Footer
    renderTimeline(data, false);
    renderHotel(data);
    renderTransport(data);
    renderAlbumLinks(data);
    renderFaq(data);
    renderFooter(data);
}

export function repopulatePage(data) {
    // Page meta
    document.title = t(data.pageTitle);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t(data.pageDescription);

    // Hero
    renderHeroInvitation(data);

    // Ceremony & Venue times (bilingual)
    document.getElementById('ceremony-time').textContent = t(data.ceremony.timeDisplay);
    document.getElementById('venue-time').textContent = t(data.venue.timeDisplay);

    // Schedule, Hotel, Transport, Album, FAQ, Footer
    renderTimeline(data, true);
    renderHotel(data);
    renderTransport(data);
    renderAlbumLinks(data);
    renderFaq(data);
    renderFooter(data);

    renderRsvp(data);
}

export function generateQRCode() {
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
