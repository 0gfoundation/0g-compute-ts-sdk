"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCryptoAdapter = getCryptoAdapter;
const env_1 = require("./env");
class NodeCryptoAdapter {
    crypto;
    constructor() {
        if ((0, env_1.isBrowser)()) {
            throw new Error('NodeCryptoAdapter can only be used in Node.js environment');
        }
    }
    async getCrypto() {
        if (!this.crypto) {
            this.crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        }
        return this.crypto;
    }
    async aesGCMEncrypt(key, data, iv) {
        const crypto = await this.getCrypto();
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { encrypted, authTag };
    }
    async aesGCMDecrypt(key, encryptedData, iv, authTag) {
        const crypto = await this.getCrypto();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);
        return decrypted;
    }
    randomBytes(length) {
        if (this.crypto) {
            return this.crypto.randomBytes(length);
        }
        // For synchronous random bytes in Node.js, we'll need to handle this differently
        // This is a limitation - ideally this should be async
        const array = new Uint8Array(length);
        // Use Node.js crypto if available (simplified fallback)
        // In production, this should ideally be async
        try {
            // Check if we're in Node.js environment by checking for process
            if (typeof process !== 'undefined' && process.versions?.node) {
                // Import crypto-browserify as fallback for browser compatibility
                const cryptoBrowserify = require('crypto-browserify');
                return cryptoBrowserify.randomBytes(length);
            }
        }
        catch {
            // Crypto not available
        }
        // Fallback to Math.random (not cryptographically secure, but functional)
        console.warn('Using Math.random for random bytes - not cryptographically secure');
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return Buffer.from(array);
    }
}
class BrowserCryptoAdapter {
    constructor() {
        if (!(0, env_1.hasWebCrypto)()) {
            throw new Error('Web Crypto API is not available in this browser');
        }
    }
    async aesGCMEncrypt(key, data, iv) {
        const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
        const result = await crypto.subtle.encrypt({
            name: 'AES-GCM',
            iv: iv,
            tagLength: 128,
        }, cryptoKey, data);
        const encrypted = new Uint8Array(result.slice(0, -16));
        const authTag = new Uint8Array(result.slice(-16));
        return {
            encrypted: Buffer.from(encrypted),
            authTag: Buffer.from(authTag),
        };
    }
    async aesGCMDecrypt(key, encryptedData, iv, authTag) {
        const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']);
        const combined = new Uint8Array(encryptedData.length + authTag.length);
        combined.set(encryptedData, 0);
        combined.set(authTag, encryptedData.length);
        const result = await crypto.subtle.decrypt({
            name: 'AES-GCM',
            iv: iv,
            tagLength: 128,
        }, cryptoKey, combined);
        return Buffer.from(result);
    }
    randomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Buffer.from(array);
    }
}
let cryptoAdapter = null;
function getCryptoAdapter() {
    if (!cryptoAdapter) {
        if ((0, env_1.isBrowser)()) {
            cryptoAdapter = new BrowserCryptoAdapter();
        }
        else {
            cryptoAdapter = new NodeCryptoAdapter();
        }
    }
    return cryptoAdapter;
}
//# sourceMappingURL=crypto-adapter.js.map