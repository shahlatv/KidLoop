const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        // Browser page requests should redirect to login.
        if (req.accepts("html") && !req.path.startsWith("/api/")) {
            return res.redirect("/auth/login");
        }

        // API requests should receive a JSON response.
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    next();
};

module.exports = authMiddleware;