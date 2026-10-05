const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

router.get("/login", (req, res) => {
    res.render("admin/login");
});
router.post("/login", adminController.login);
router.post("/logout", adminAuth, adminController.logout);
router.get(
    "/dashboard",
    adminAuth,
    (req, res) => {
        res.render("admin/dashboard");
    }
);
router.get("/users", adminAuth, adminController.getUsers);
router.patch("/users/:id/block", adminAuth, adminController.toggleUserBlock);

module.exports = router;