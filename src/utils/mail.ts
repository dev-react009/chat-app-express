import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (to: string, name: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Hello ${name},\n\nWelcome to our chat app! We are glad to have you on board.\n\nBest regards,\nChat App Team`,
    html: "Welcome to Our Chat App!",
    text: `<p>Hello ${name},</p><p>Welcome to our chat app! We are glad to have you on board.</p><p>Best regards,<br>Chat App Team</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully.");
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};