/**
 * FAQ section — rendering and accordion interaction.
 */

import { t } from './i18n.js';
import { escapeHtml } from './utils.js';

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

export function renderFaq(data) {
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

export function initFaqAccordion() {
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
