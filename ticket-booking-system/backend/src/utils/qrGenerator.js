const QRCode = require('qrcode');

// Encodes the booking reference (and a couple of extra fields) into a QR
// code and returns it as a base64 data URL so it can be embedded directly
// in the confirmation email / stored on the Booking record.
async function generateBookingQR({ reference, eventId, userId }) {
  const payload = JSON.stringify({ reference, eventId, userId });
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
  });
  return dataUrl;
}

module.exports = { generateBookingQR };
