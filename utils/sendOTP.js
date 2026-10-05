const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendOTP = async (email, otp, purpose) => {
    let subject = "KidLoop OTP Verification";

    if (purpose === "forgot-password") {
        subject = "KidLoop Password Reset OTP";
    } else if (purpose === "email-change") {
        subject = "KidLoop Email Change OTP";
    }

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: `Your KidLoop OTP is ${otp}. This OTP is valid for 60 seconds.`
    });
};

module.exports = sendOTP;