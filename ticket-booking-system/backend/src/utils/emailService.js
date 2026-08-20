const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/env');

let transporterPromise = null;

// Lazily build a transporter. If real SMTP creds are supplied via .env, use
// them. Otherwise auto-provision a free Ethereal test inbox so the whole
// booking + waitlist email flow can be demoed with zero email account setup.
async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    }
    const testAccount = await nodemailer.createTestAccount();
    console.log('\n[emailService] No SMTP creds set — using an Ethereal test inbox.');
    console.log('[emailService] Preview links for every sent email will be logged below.\n');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

async function sendMail({ to, subject, html, attachments }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    attachments,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[emailService] Preview URL (${subject} -> ${to}): ${previewUrl}`);
  }
  return { info, previewUrl };
}

function bookingConfirmationEmail({ name, eventTitle, seats, reference, totalAmount, qrCodeDataUrl }) {
  return {
    subject: `Booking Confirmed — ${eventTitle} (${reference})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#4338ca;">Booking Confirmed 🎟️</h2>
        <p>Hi ${name},</p>
        <p>Your booking for <strong>${eventTitle}</strong> is confirmed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding:4px 0;color:#555;">Booking Reference</td><td style="text-align:right;font-weight:bold;">${reference}</td></tr>
          <tr><td style="padding:4px 0;color:#555;">Seats</td><td style="text-align:right;">${seats}</td></tr>
          <tr><td style="padding:4px 0;color:#555;">Total Paid</td><td style="text-align:right;font-weight:bold;">₹${totalAmount}</td></tr>
        </table>
        <p>Scan the QR code below at the venue entrance:</p>
        <img src="${qrCodeDataUrl}" alt="QR Code" style="width:180px;height:180px;" />
        <p style="color:#888;font-size:12px;margin-top:24px;">This ticket is tied to your booking reference. Please do not share it.</p>
      </div>
    `,
  };
}

function waitlistOfferEmail({ name, eventTitle, categoryName, link, minutesLeft }) {
  return {
    subject: `A seat opened up — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#059669;">A seat is available! 🎉</h2>
        <p>Hi ${name},</p>
        <p>A <strong>${categoryName}</strong> seat for <strong>${eventTitle}</strong> just opened up from your waitlist.</p>
        <p>You have <strong>${minutesLeft} minutes</strong> to complete your booking before it's offered to the next person in line.</p>
        <p><a href="${link}" style="display:inline-block;background:#4338ca;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Complete Booking</a></p>
        <p style="color:#888;font-size:12px;">If you don't complete the booking in time, this seat will be released automatically.</p>
      </div>
    `,
  };
}

module.exports = { sendMail, bookingConfirmationEmail, waitlistOfferEmail };
