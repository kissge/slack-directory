import { webcrypto } from 'crypto';

const crypto = /** @type {Crypto} */ (/** @type {unknown} */ (webcrypto));

(async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('jwk', key);
  console.log(exported.k);
})();
