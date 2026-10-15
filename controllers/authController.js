const authService = require("../services/authService");
const otpService = require("../services/otpService");


/* =========================================
   SIGNUP
========================================= */

const signup = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            confirmPassword
        } = req.body;

        const result = await authService.signup(
            req,
            name,
            email,
            password,
            confirmPassword,
            phone
        );

        res.status(200).json({
            success: true,
            message: "OTP generated successfully",
            email: result.email
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* =========================================
   VERIFY SIGNUP OTP
========================================= */

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const user = await otpService.verifySignupOTP(
            req,
            email,
            otp
        );


        /*
         * Automatically log the newly registered
         * user into the application.
         */
        req.session.userId = user._id;


        res.status(201).json({
            success: true,
            message: "Signup successful",
            userId: user._id
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* =========================================
   RESEND OTP
========================================= */

const resendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        if (!email || !purpose) {
            return res.status(400).json({
                success: false,
                message: "Email and purpose are required"
            });
        }

        const result = await otpService.resendOTP(
            req,
            email,
            purpose
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


/* =========================================
   FORGOT PASSWORD
========================================= */

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const result =
            await otpService.createForgotPasswordOTP(
                email
            );

        res.status(200).json({
            success: true,
            message: result.message,
            email: result.email
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* =========================================
   VERIFY FORGOT PASSWORD OTP
========================================= */

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const result =
            await otpService.verifyForgotPasswordOTP(
                email,
                otp
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


/* =========================================
   RESET PASSWORD
========================================= */

const resetPassword = async (req, res) => {
    try {
        const {
            email,
            newPassword,
            confirmPassword
        } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const result =
            await authService.resetPassword(
                email,
                newPassword,
                confirmPassword
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


/* =========================================
   LOGIN
========================================= */

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await authService.login(
            email,
            password
        );

        req.session.userId = user._id;

        res.status(200).json({
            success: true,
            message: "Login successful",
            userId: user._id
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


/* =========================================
   LOGOUT
========================================= */
const logout = async (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    });
};

/* =========================================
   EXPORT
========================================= */

module.exports = {
    signup,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
    login,
    logout
};