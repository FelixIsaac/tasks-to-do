if (!process.env.MAILGUN_API_KEY) throw "Missing Mailgun API key";
if (!process.env.MAILGUN_DOMAIN) throw "Missing Mailgun Domain name";

import mailgun from "mailgun-js";
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

interface Mail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendMail = async (mail: Mail) => {
  try {
    await mg.messages().send(mail);
  } catch (err) {
    console.error(err);
  }
};
