const userService = require("../services/userService");

const getProfile = async (req, res) => {
    try {
        const user = await userService.getProfile(req.session.userId);

        res.render("user/profile", {
            user
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).send("Unable to load profile");
    }
};
const updateProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            profileImage
        } = req.body;

        const user = await userService.updateProfile(
            req.session.userId,
            name,
            phone,
            profileImage
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        const user = await userService.changePassword(
            req.session.userId,
            currentPassword,
            newPassword,
            confirmPassword
        );

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const changeEmail = async (req, res) => {
    try {
        const { newEmail } = req.body;

        const result = await userService.changeEmail(
            req.session.userId,
            newEmail
        );

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyEmailOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }

        await userService.verifyEmailOTP(
            req.session.userId,
            otp
        );

        res.status(200).json({
            success: true,
            message: "Email changed successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    changeEmail,
    verifyEmailOTP
};