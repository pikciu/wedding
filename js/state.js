/**
 * Shared application state and configuration.
 * All modules import `state` to read/write shared values.
 */

export var CONFIG = {
    animationThreshold: 0.2,
    scrollOffset: 100
};

export var state = {
    translations: null,
    currentLang: null,
    currentData: null,
    currentGuestKey: null
};
