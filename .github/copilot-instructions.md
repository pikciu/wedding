# Project Guidelines

## Overview

Single-page encrypted wedding invitation. Vanilla JS, no frameworks, no npm dependencies. Bilingual: Polish (pl) and Ukrainian (ua).

## Architecture

```
index.html          — Lock screen + all page sections (single HTML file)
css/style.css       — All styles; CSS variables in :root for theming
js/main.js          — Decryption, i18n, countdown, navigation, rendering
js/encrypted-data.js — AUTO-GENERATED, never edit manually
data/wedding-data.json  — Source of truth for all wedding content
data/translations.json  — UI strings keyed by section (pl/ua)
scripts/encrypt.js      — Node CLI: encrypts wedding-data.json → encrypted-data.js
images/icons/            — SVG icons referenced by schedule items
```

## Build

Re-encrypt data after editing `data/wedding-data.json`:

```bash
node scripts/encrypt.js
```

Prompts for password interactively. Outputs `js/encrypted-data.js`.

## Conventions

- **i18n**: Translatable fields use `{ "pl": "...", "ua": "..." }` objects. The `t()` helper in main.js normalizes these. All user-facing strings must support both languages.
- **No innerHTML for untrusted data**: Use `.textContent` or the `escapeHtml()` utility. SVG icon filenames are validated against `/^[a-z0-9][a-z0-9-]*\.svg$/`.
- **CSS variables**: Theme colors (sage green `#9CAF88`, terracotta `#D4A373`, cream `#FDFBF7`) and spacing defined in `:root`. Use variables, not raw hex values.
- **Mobile-first**: Responsive via CSS Grid `auto-fit, minmax`. Test at mobile widths.
- **Data-driven rendering**: All content comes from decrypted JSON. Never hardcode wedding-specific text in HTML or JS beyond the lock screen skeleton.

## Security

- AES-256-GCM encryption with PBKDF2 key derivation (100k iterations, SHA-256)
- Client-side decryption via Web Crypto API mirrors Node.js encrypt script parameters exactly — keep them in sync
- Password sources (priority): URL hash → localStorage → form input
- No plaintext wedding data in committed HTML, JS, or localStorage

## UI Preferences

- Album section: Two platform cards (Android/Apple) with icon on top, QR in middle, "Otwórz album" button at bottom.
