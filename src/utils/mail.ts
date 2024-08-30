import nodemailer from "nodemailer";
import { log } from "./logger";

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
    html: `Hello ${name},\n\nWelcome to our chatCloudHub! We're thrilled to welcome you to our ChatCloud community! 🎉\n\nBest regards,\nChat App Team \n\n Thank you for joining us. We're excited to have you on board and can't wait for you to start exploring all the features we've designed to help you connect, chat, and have fun.\n\n If you ever need assistance, don't hesitate to reach out. We're here to help you make the most out of your experience.\n\nHappy chatting! \n\n Best regards, \n\n ChatCloudHubTeam`,
    subject: "Welcome to Our ChatCloudHub!",
    text: `<p>Hello ${name},</p> <br> <p>We're thrilled to welcome you to our ChatCloud community! 🎉</p> <br> <p>Thank you for joining us. We're excited to have you on board and can't wait for you to start exploring all the features we've designed to help you connect, chat, and have fun.</p> <br>  <p>If you ever need assistance, don't hesitate to reach out. We're here to help you make the most out of your experience.</p> <br>  <b>Happy chatting!</b><p>Best regards,<br> <b> ChatCloudHubTeam</b></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    log("Welcome email sent successfully.");
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};