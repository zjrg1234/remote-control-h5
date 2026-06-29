// src/utils/crypto.ts
import CryptoJS from 'crypto-js';

// 定义密钥（需与后端保持一致，通常为16或32位字符串）
const SECRET_KEY: string = 'xyv8isi9on888888'; 

// 将密钥转换为 UTF-8 编码的 WordArray 格式
const key: CryptoJS.lib.WordArray = CryptoJS.enc.Utf8.parse(SECRET_KEY);

/**
 * AES 加密
 * @param plaintext - 需要加密的明文
 * @returns 加密后的 Base64 字符串
 */
export function encryptAES(plaintext: string): string {
    const encrypted: CryptoJS.lib.CipherParams = CryptoJS.AES.encrypt(plaintext, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString(); // 返回 Base64 格式的密文
}

/**
 * AES 解密
 * @param ciphertext - 需要解密的密文
 * @returns 解密后的 UTF-8 明文字符串
 */
export function decryptAES(ciphertext: string): string {
    const decrypted: CryptoJS.lib.WordArray = CryptoJS.AES.decrypt(ciphertext, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8); // 将二进制数据转回 UTF-8 字符串
}