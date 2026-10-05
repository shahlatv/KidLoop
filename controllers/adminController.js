const adminService = require("../services/adminService");


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await adminService.login(
            email,
            password
        );

        req.session.adminId = admin._id;

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            adminId: admin._id
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


const logout = async (req, res) => {
    try {
        req.session.destroy((error) => {

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Admin logout failed"
                });
            }

            res.status(200).json({
                success: true,
                message: "Admin logout successful"
            });
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 5 } = req.query;

        const result = await adminService.getUsers(
            search,
            Number(page),
            Number(limit)
        );

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const toggleUserBlock = async (req, res) => {
    try {
        const user = await adminService.toggleUserBlock(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: user.isBlocked
                ? "User blocked successfully"
                : "User unblocked successfully",
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    login,
    logout,
     getUsers,
     toggleUserBlock
};