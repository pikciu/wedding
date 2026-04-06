/**
 * Shared Crypto Utilities
 * AES-256-GCM decryption with PBKDF2 key derivation (Web Crypto API)
 * Used by main.js and invitation.js
 */

var CryptoUtils = (function () {
    var CRYPTO = {
        iterations: 100000,
        hash: 'SHA-256',
        algorithm: 'AES-GCM',
        keyLength: 256
    };

    function base64ToBytes(base64) {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async function deriveKey(password, salt) {
        var encoder = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: CRYPTO.iterations,
                hash: CRYPTO.hash
            },
            keyMaterial,
            { name: CRYPTO.algorithm, length: CRYPTO.keyLength },
            false,
            ['decrypt']
        );
    }

    async function decryptData(password, encryptedDataObj) {
        var salt = base64ToBytes(encryptedDataObj.salt);
        var iv = base64ToBytes(encryptedDataObj.iv);
        var data = base64ToBytes(encryptedDataObj.data);

        var key = await deriveKey(password, salt);

        var decrypted = await crypto.subtle.decrypt(
            { name: CRYPTO.algorithm, iv: iv },
            key,
            data
        );

        var decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    return {
        decryptData: decryptData,
        escapeHtml: escapeHtml
    };
})();
