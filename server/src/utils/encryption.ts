import CryptoJS from "crypto-js";
const key = "ThisIsAVerySecretSecretiveKey...$$$"

export const encrypt = (text: string) => CryptoJS.AES.encrypt(text, key).toString();
export const decrypt = (text: string) => CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
