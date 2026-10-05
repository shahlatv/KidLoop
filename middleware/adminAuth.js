const adminAuth = (req, res, next) => {

    if (!req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: "Admin login required"
        });
    }

    next();
};

module.exports = adminAuth;