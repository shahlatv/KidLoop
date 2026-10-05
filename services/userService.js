const User = require("../models/User");
const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const generateOTP = require("../utils/generateOTP");
const sendOTP = require("../utils/sendOTP");

const getProfile = async (userId) => {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

const updateProfile = async (userId, name, phone, profileImage) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (name !== undefined) {
        user.name = name;
    }

    if (phone !== undefined) {
        user.phone = phone;
    }

    if (profileImage !== undefined) {
        user.profileImage = profileImage;
    }

    await user.save();

    return user;
};

const changePassword = async (
    userId,
    currentPassword,
    newPassword,
    confirmPassword
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isCurrentPasswordCorrect) {
        throw new Error("Current password is incorrect");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
    }

    if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return user;
};

const changeEmail = async (userId, newEmail) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (!newEmail) {
        throw new Error("New email is required");
    }

    if (newEmail.toLowerCase() === user.email) {
        throw new Error("New email must be different from current email");
    }

    const existingUser = await User.findOne({
        email: newEmail.toLowerCase()
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 60 * 1000);

    await OTP.deleteMany({
        userId,
        purpose: "email-change"
    });

    await OTP.create({
        userId,
        email: newEmail,
        otp,
        purpose: "email-change",
        expiresAt
    });

    console.log(`Email change OTP for ${newEmail}: ${otp}`);
    await sendOTP(newEmail, otp, "email-change");

    return {
        message: "OTP generated successfully"
    };
};

const verifyEmailOTP = async (userId, enteredOTP) => {
    const otpRecord = await OTP.findOne({
        userId,
        purpose: "email-change"
    });

    if (!otpRecord) {
        throw new Error("OTP not found or expired");
    }

    if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });

        throw new Error("OTP has expired");
    }

    if (otpRecord.otp !== enteredOTP) {
        throw new Error("Invalid OTP");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    user.email = otpRecord.email;

    await user.save();

    await OTP.deleteOne({
        _id: otpRecord._id
    });

    return user;
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    changeEmail,
    verifyEmailOTP
};