const OTP = require("../models/OTP");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const bcrypt = require("bcrypt");
const sendOTP = require("../utils/sendOTP");


const createSignupOTP = async (
    req,
    name,
    email,
    phone,
    password
) => {

    const otp = generateOTP();

    const hashedPassword = await bcrypt.hash(password, 10);

    const expiresAt = new Date(Date.now() + 60 * 1000);

    // Store temporary signup details in session
    req.session.signupData = {
        name,
        email,
        phone,
        password: hashedPassword
    };

    // Remove previous signup OTP
    await OTP.deleteMany({
        email,
        purpose: "signup"
    });

    // Store OTP in database
    await OTP.create({
        email,
        phone,
        otp,
        purpose: "signup",
        expiresAt,
        isVerified: false
    });

    console.log(`Signup OTP for ${email}: ${otp}`);
    await sendOTP(email, otp, "signup");

    return {
        email,
        message: "OTP generated successfully"
    };
};


const verifySignupOTP = async (req, email, enteredOTP) => {

    const signupData = req.session.signupData;

    if (!signupData) {
        throw new Error("Signup session expired. Please signup again");
    }

    const otpRecord = await OTP.findOne({
        email,
        purpose: "signup"
    });

    if (!otpRecord) {
        throw new Error("OTP not found or expired");
    }

    if (new Date() > otpRecord.expiresAt) {

        await OTP.deleteOne({
            _id: otpRecord._id
        });

        delete req.session.signupData;

        throw new Error("OTP has expired");
    }

    if (otpRecord.otp !== enteredOTP) {
        throw new Error("Invalid OTP");
    }

    const user = await User.create({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        isVerified: true,
        authProvider: "local"
    });

    otpRecord.isVerified = true;

    await otpRecord.save();

    // Remove temporary signup data
    delete req.session.signupData;

    // Remove OTP after successful verification
    await OTP.deleteOne({
        _id: otpRecord._id
    });

    return user;
};

const resendOTP = async (req, email, purpose) => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    if (purpose === "signup") {
        const signupData = req.session.signupData;

        if (!signupData) {
            throw new Error("Signup session expired. Please signup again");
        }

        await OTP.deleteMany({
            email,
            purpose: "signup"
        });

        await OTP.create({
            email,
            phone: signupData.phone,
            otp,
            purpose: "signup",
            expiresAt,
            isVerified: false
        });
    } else {
        const otpRecord = await OTP.findOne({
            email,
            purpose
        });

        if (!otpRecord) {
            throw new Error("OTP request not found");
        }

        otpRecord.otp = otp;
        otpRecord.expiresAt = expiresAt;
        otpRecord.isVerified = false;

        await otpRecord.save();
    }

    console.log(`Resent OTP for ${email}: ${otp}`);

    await sendOTP(email, otp, purpose);

    return {
        email,
        message: "OTP resent successfully"
    };
};

const createForgotPasswordOTP = async (email) => {

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new Error("No account found with this email");
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 60 * 1000);

    await OTP.deleteMany({
        email: email.toLowerCase(),
        purpose: "forgot-password"
    });

    await OTP.create({
        userId: user._id,
        email: email.toLowerCase(),
        otp,
        purpose: "forgot-password",
        expiresAt,
        isVerified: false
    });

    console.log(`Forgot password OTP for ${email}: ${otp}`);
    await sendOTP(email, otp, "forgot-password");
    
    return {
        email: email.toLowerCase(),
        message: "OTP generated successfully"
    };
};

const verifyForgotPasswordOTP = async (email, enteredOTP) => {

    const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: "forgot-password"
    });

    if (!otpRecord) {
        throw new Error("OTP not found or expired");
    }

    if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({
            _id: otpRecord._id
        });

        throw new Error("OTP has expired");
    }

    if (otpRecord.otp !== enteredOTP) {
        throw new Error("Invalid OTP");
    }

    otpRecord.isVerified = true;

    await otpRecord.save();

    return {
        message: "OTP verified successfully"
    };
};


module.exports = {
    createSignupOTP,
    verifySignupOTP,
    resendOTP,
    createForgotPasswordOTP,
    verifyForgotPasswordOTP
};