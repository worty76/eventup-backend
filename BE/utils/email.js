const Brevo = require("@getbrevo/brevo");

// Initialize Brevo API with API key
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async (options) => {
  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.sender = {
      name: process.env.EMAIL_FROM_NAME || "Job Event Up",
      email: process.env.EMAIL_FROM_ADDRESS || "jobeventweb@gmail.com",
    };
    sendSmtpEmail.htmlContent = options.html || options.text;
    sendSmtpEmail.textContent = options.text;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent via Brevo:", data.messageId);
    return data;
  } catch (error) {
    console.error("Brevo email send error:", error);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, otp) => {
  const subject = "Verify Your Account";
  const text = `Your OTP code is: ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Email Verification</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

// Send application notification email
const sendApplicationNotification = async (email, eventTitle) => {
  const subject = "New Application Received";
  const text = `You have received a new application for your event: ${eventTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>New Application</h2>
      <p>You have received a new application for your event:</p>
      <h3>${eventTitle}</h3>
      <p>Please log in to your account to review the application.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

// Send approval notification email
const sendApprovalEmail = async (email, eventTitle) => {
  const subject = "Application Approved";
  const text = `Your application for "${eventTitle}" has been approved!`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Congratulations!</h2>
      <p>Your application for the following event has been approved:</p>
      <h3>${eventTitle}</h3>
      <p>Please log in to your account for more details.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendApplicationNotification,
  sendApprovalEmail,
};
