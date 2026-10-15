const categoryService = require("../services/categoryService");
const path = require("path");


// Display the category management page
const renderCategories = async (req, res) => {
    try {
        const categoryData = await categoryService.getAllCategories({
            search: req.query.search || "",
            page: req.query.page || 1,
            sort: req.query.sort || "newest"
        });

        res.render("admin/categories", {
            ...categoryData,
            success: req.query.success || "",
            error: req.query.error || ""
        });

    } catch (error) {
        console.error("Render categories error:", error);
        res.status(500).send("Unable to load categories");
    }
};

// Create a category
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;

        await categoryService.createCategory(name || "", image);

        res.redirect("/admin/categories?success=Category%20created%20successfully");
    } catch (error) {
        console.error("Create category error:", error);

        // Remove uploaded image if creation fails
        if (req.file) {
            const fs = require("fs");
            const imagePath = path.join(
                __dirname,
                "../../public/uploads/categories",
                req.file.filename
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const message = encodeURIComponent(
            error.message || "Unable to create category"
        );

        res.redirect(`/admin/categories?error=${message}`);
    }
};

// Update category name and image
const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;

        await categoryService.updateCategory(
            req.params.id,
            name,
            image
        );

        res.redirect("/admin/categories?success=Category%20updated%20successfully");
    } catch (error) {
        console.error("Update category error:", error);

        const message = encodeURIComponent(
            error.message || "Unable to update category"
        );

        res.redirect(`/admin/categories?error=${message}`);
    }
};

// Activate or deactivate a category
const toggleCategoryStatus = async (req, res) => {
    try {
        const category = await categoryService.toggleCategoryStatus(
            req.params.id
        );

        const message = category.isActive
            ? "Category activated successfully"
            : "Category deactivated successfully";

        res.redirect(`/admin/categories?success=${encodeURIComponent(message)}`);
    } catch (error) {
        console.error("Toggle category status error:", error);

        res.redirect(
            `/admin/categories?error=${encodeURIComponent(error.message)}`
        );
    }
};

// Archive a category instead of permanently deleting it
const archiveCategory = async (req, res) => {
    try {
        await categoryService.archiveCategory(req.params.id);

        res.redirect("/admin/categories?success=Category%20archived%20successfully");
    } catch (error) {
        console.error("Archive category error:", error);

        res.redirect(
            `/admin/categories?error=${encodeURIComponent(error.message)}`
        );
    }
};

module.exports = {
    renderCategories,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    archiveCategory
};