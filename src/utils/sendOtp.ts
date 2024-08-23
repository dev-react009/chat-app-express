import crypto from "crypto";
import nodemailer from "nodemailer";

export const generateOTP  =():string =>{
    return crypto.randomInt(100000,999999).toString();

};

export const sendOTPEmail = async(email:string,otp:string)=>{
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: "Password Reset OTP",
  text: `Your OTP for password reset is: ${otp}`,
};

await transporter.sendMail(mailOptions)
}

