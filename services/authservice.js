const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");

const {
    isValidEmail,
    isStrongPassword
} = require("../utils/validators");

const otpService = require("./otpService");


const signup = async (
    req,
    name,
    email,
    password,
    confirmPassword,
    phone
) => {

    if (!name || !email || !password || !confirmPassword || !phone) {
        throw new Error("All fields are required");
    }

    if (!isValidEmail(email)) {
        throw new Error("Please enter a valid email");
    }

    if (!isStrongPassword(password)) {
        throw new Error(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
        );
    }

    if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
    }

    const existingUser = await User.findOne({
        email: email.toLowerCase()
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    await otpService.createSignupOTP(
        req,
        name,
        email.toLowerCase(),
        phone,
        password
    );

    return {
        email: email.toLowerCase(),
        message: "OTP generated successfully"
    };
};


const login = async (email, password) => {

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    if (!user.isVerified) {
        throw new Error("Please verify your account first");
    }

    if (user.isBlocked) {
        throw new Error("Your account has been blocked");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    return user;
};
const resetPassword = async (
    email,
    newPassword,
    confirmPassword
) => {

    if (!email || !newPassword || !confirmPassword) {
        throw new Error("All fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
    }

    if (!isStrongPassword(newPassword)) {
        throw new Error(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
        );
    }

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new Error("User not found");
    }

    const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        purpose: "forgot-password",
        isVerified: true
    });

    if (!otpRecord) {
        throw new Error("Please verify OTP first");
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    user.password = hashedPassword;

    await user.save();

    await OTP.deleteOne({
        _id: otpRecord._id
    });

    return {
        message: "Password reset successfully"
    };
};

module.exports = {
    signup,
    login,
    resetPassword
};