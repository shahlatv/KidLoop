const Admin = require("../models/Admin");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const login = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const admin = await Admin.findOne({
        email: email.toLowerCase()
    });

    if (!admin) {
        throw new Error("Invalid admin email or password");
    }

    if (!admin.isActive) {
        throw new Error("Admin account is inactive");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        admin.passwordHash
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid admin email or password");
    }

    return admin;
};


const getUsers = async (search = "", page = 1, limit = 5) => {
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
        ];
    }

    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password");

    const totalUsers = await User.countDocuments(query);

    return {
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
    };
};

const toggleUserBlock = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    return user;
};

module.exports = {
    login,
    getUsers,
     toggleUserBlock
};