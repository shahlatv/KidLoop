const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("../config/passport");

// Start Google login
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// Google callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/auth/login",
        session: false
    }),
    (req, res) => {

        req.session.userId = req.user._id;

        res.redirect("/");
    }
);

router.post("/signup", authController.signup);

router.post("/verify-otp", authController.verifyOTP);

router.post("/resend-otp", authController.resendOTP);

router.post(
    "/forgot-password",
    authController.forgotPassword
);

router.post(
    "/verify-forgot-password-otp",
    authController.verifyForgotPasswordOTP
);

router.post(
    "/reset-password",
    authController.resetPassword
);

router.get("/login", (req, res) => {
    res.render("auth/login");
});

router.post("/login", authController.login);

router.post("/logout", authController.logout);

router.get("/otp", (req, res) => {
    const email = req.session.signupData?.email || "";

    res.render("auth/otp", {
        email
    });
});

router.get("/signup", (req, res) => {
    res.render("auth/signup");
});

router.get("/forgot-password", (req, res) => {
    res.render("auth/forgot-password");
});

router.get("/forgot-password/otp", (req, res) => {
    res.render("auth/forgot-password-otp");
});

router.get("/reset-password", (req, res) => {
    res.render("auth/reset-password");
});

module.exports = router;