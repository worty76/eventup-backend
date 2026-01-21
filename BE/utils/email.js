const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    // đoạn này để test email trong dev môi trường không có email config
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️  Email credentials not configured. Email simulation:');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   Content:', options.text);
      console.log('   [DEV MODE] Email would be sent in production');
      return { messageId: 'dev-mode-no-email', simulated: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, otp) => {
  const subject = 'Verify Your Account';
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
  const subject = 'New Application Received';
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
  const subject = 'Application Approved';
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
  sendApprovalEmail
};
