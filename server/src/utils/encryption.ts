import aesjs from "aes-js";
const key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10 , 11, 12, 13, 14, 15, 16];

export const encrypt = (text: string) => {
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  return aesjs.utils.hex.fromBytes(aesCtr.encrypt(aesjs.utils.utf8.toBytes(text)));
};

export const decrypt = (text: string) => {
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  return aesjs.utils.utf8.fromBytes(aesCtr.decrypt(aesjs.utils.hex.toBytes(text)));
};
