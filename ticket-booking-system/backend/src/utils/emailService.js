const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = require('../config/env');


// ============================================================
// TRANSPORTER
// ============================================================

let transporter = null;


function getTransporter() {

  if (transporter) {
    return transporter;
  }


  // ----------------------------------------------------------
  // CHECK SMTP CONFIGURATION
  // ----------------------------------------------------------

  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS
  ) {

    console.error(
      '[emailService] SMTP configuration is missing.'
    );

    throw new Error(
      'SMTP configuration is missing. Check SMTP_HOST, SMTP_USER and SMTP_PASS.'
    );

  }


  // ----------------------------------------------------------
  // CREATE BREVO SMTP TRANSPORTER
  // ----------------------------------------------------------

  transporter =
    nodemailer.createTransport({

      host:
        SMTP_HOST,

      port:
        Number(SMTP_PORT) || 587,

      secure:
        Number(SMTP_PORT) === 465,

      auth: {

        user:
          SMTP_USER,

        pass:
          SMTP_PASS,

      },

    });


  return transporter;

}


// ============================================================
// VERIFY SMTP CONNECTION
// ============================================================

async function verifyEmailConnection() {

  try {

    const mailer =
      getTransporter();

    await mailer.verify();

    console.log(
      '[emailService] SMTP connection successful.'
    );

    return true;

  } catch (error) {

    console.error(
      '[emailService] SMTP connection failed:',
      error.message
    );

    return false;

  }

}


// ============================================================
// SEND EMAIL
// ============================================================

async function sendMail({
  to,
  subject,
  html,
  attachments,
}) {

  try {

    if (!to) {

      throw new Error(
        'Recipient email address is required.'
      );

    }


    if (!subject) {

      throw new Error(
        'Email subject is required.'
      );

    }


    const mailer =
      getTransporter();


    // --------------------------------------------------------
    // FROM ADDRESS
    // --------------------------------------------------------

    const from =
      SMTP_FROM ||
      SMTP_USER;


    // --------------------------------------------------------
    // SEND
    // --------------------------------------------------------

    const info =
      await mailer.sendMail({

        from,

        to,

        subject,

        html,

        attachments,

      });


    console.log(
      `[emailService] Email sent successfully: ${subject} -> ${to}`
    );


    console.log(
      `[emailService] Message ID: ${info.messageId}`
    );


    return {
      info,
      previewUrl: null,
    };

  } catch (error) {

    console.error(
      `[emailService] Failed to send email to ${to}:`,
      error
    );

    throw error;

  }

}


// ============================================================
// BOOKING CONFIRMATION EMAIL
// ============================================================

function bookingConfirmationEmail({
  name,
  eventTitle,
  seats,
  reference,
  totalAmount,
  qrCodeDataUrl,
}) {

  return {

    subject:
      `Booking Confirmed — ${eventTitle} (${reference})`,

    html: `

      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 480px;
          margin: auto;
          padding: 20px;
        "
      >

        <h2 style="color:#4338ca;">
          Booking Confirmed 🎟️
        </h2>


        <p>
          Hi ${name},
        </p>


        <p>
          Your booking for
          <strong>${eventTitle}</strong>
          is confirmed.
        </p>


        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin:16px 0;
          "
        >

          <tr>

            <td
              style="
                padding:4px 0;
                color:#555;
              "
            >
              Booking Reference
            </td>

            <td
              style="
                text-align:right;
                font-weight:bold;
              "
            >
              ${reference}
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:4px 0;
                color:#555;
              "
            >
              Seats
            </td>

            <td
              style="
                text-align:right;
              "
            >
              ${seats}
            </td>

          </tr>


          <tr>

            <td
              style="
                padding:4px 0;
                color:#555;
              "
            >
              Total Paid
            </td>

            <td
              style="
                text-align:right;
                font-weight:bold;
              "
            >
              ₹${totalAmount}
            </td>

          </tr>

        </table>


        <p>
          Scan the QR code below at the venue entrance:
        </p>


        ${
          qrCodeDataUrl
            ? `
              <div style="text-align:center;">

                <img
                  src="${qrCodeDataUrl}"
                  alt="QR Code"
                  style="
                    width:180px;
                    height:180px;
                  "
                />

              </div>
            `
            : ''
        }


        <p
          style="
            color:#888;
            font-size:12px;
            margin-top:24px;
          "
        >
          This ticket is tied to your booking reference.
          Please do not share it.
        </p>


        <hr
          style="
            border:none;
            border-top:1px solid #eee;
            margin:24px 0;
          "
        />


        <p
          style="
            color:#888;
            font-size:12px;
            text-align:center;
          "
        >
          StageOne Ticket Booking
        </p>

      </div>

    `,

  };

}


// ============================================================
// WAITLIST OFFER EMAIL
// ============================================================

function waitlistOfferEmail({
  name,
  eventTitle,
  categoryName,
  link,
  minutesLeft,
}) {

  return {

    subject:
      `A seat opened up — ${eventTitle}`,

    html: `

      <div
        style="
          font-family:Arial, sans-serif;
          max-width:480px;
          margin:auto;
          padding:20px;
        "
      >

        <h2 style="color:#059669;">
          A seat is available! 🎉
        </h2>


        <p>
          Hi ${name},
        </p>


        <p>
          A
          <strong>${categoryName}</strong>
          seat for
          <strong>${eventTitle}</strong>
          just opened up from your waitlist.
        </p>


        <p>

          You have
          <strong>${minutesLeft} minutes</strong>
          to complete your booking before it is offered
          to the next person in line.

        </p>


        <p>

          <a
            href="${link}"
            style="
              display:inline-block;
              background:#4338ca;
              color:white;
              padding:10px 18px;
              border-radius:6px;
              text-decoration:none;
            "
          >
            Complete Booking
          </a>

        </p>


        <p
          style="
            color:#888;
            font-size:12px;
          "
        >

          If you don't complete the booking in time,
          this seat will be released automatically.

        </p>


        <hr
          style="
            border:none;
            border-top:1px solid #eee;
            margin:24px 0;
          "
        />


        <p
          style="
            color:#888;
            font-size:12px;
            text-align:center;
          "
        >
          StageOne Ticket Booking
        </p>

      </div>

    `,

  };

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  sendMail,

  bookingConfirmationEmail,

  waitlistOfferEmail,

  verifyEmailConnection,

};