const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendResetEmail(email, resetLink) {
  const useGmail = process.env.USE_GMAIL === "true";

  let transporter;

  if (useGmail) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.RESEND_SMTP_USER,
        pass: process.env.RESEND_SMTP_PASSWORD,
      },
    });
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your tuitiondekho password",
    html: `
      <p>You requested a password reset.</p>
      <a href="${resetLink}">Click here to reset</a>
      <br><br>
      <strong>This link expires in 15 minutes.</strong>
    `,
  });
}

module.exports = { sendResetEmail };
