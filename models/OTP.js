const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            default: null,
            trim: true
        },

        otp: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            enum: ["signup", "email-change", "forgot-password"],
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        },

        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("OTP", otpSchema);