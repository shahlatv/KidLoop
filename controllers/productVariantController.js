const productVariantService = require("../services/productVariantService");
const Product = require("../models/productModel");
const fs = require("fs");
const path = require("path");

// Display Product Variant Management page
const renderVariants = async (req, res) => {
    try {
        const products = await Product.find({
            isDeleted: false,
            isListed: true
        }).sort({ name: 1 });

        const variants = await productVariantService.getAllVariants();

        res.render("admin/productVariants", {
            products,
            variants,
            success: req.query.success || "",
            error: req.query.error || ""
        });
    } catch (error) {
        console.error("Render variants error:", error);
        res.status(500).send("Unable to load product variants");
    }
};


// Create a product variant
const createVariant = async (req, res) => {
    const uploadedFiles = req.files || [];

    try {
        if (uploadedFiles.length < 3) {
            throw new Error("Please upload at least 3 images for this variant");
        }

        const imagePaths = uploadedFiles.map(
            file => `/uploads/product-variants/${file.filename}`
        );

        await productVariantService.createVariant(
            req.body,
            imagePaths
        );

        res.redirect(
            "/admin/product-variants?success=Product%20variant%20created%20successfully"
        );
    } catch (error) {
        // Remove newly uploaded images if variant creation fails
        for (const file of uploadedFiles) {
            fs.unlink(
                file.path,
                unlinkError => {
                    if (unlinkError) {
                        console.error(
                            "Unable to remove uploaded image:",
                            unlinkError.message
                        );
                    }
                }
            );
        }

        console.error("Create variant error:", error);

        res.redirect(
            `/admin/product-variants?error=${encodeURIComponent(error.message)}`
        );
    }
};


// Update product variant details
const updateVariant = async (req, res) => {
    const uploadedFiles = req.files || [];

    try {
        const imagePaths = uploadedFiles.map(
            file => `/uploads/product-variants/${file.filename}`
        );

        await productVariantService.updateVariant(
            req.params.id,
            req.body,
            imagePaths
        );

        res.redirect(
            "/admin/product-variants?success=Variant%20updated%20successfully"
        );

    } catch (error) {
        // Remove newly uploaded images if updating fails
        const fs = require("fs");

        for (const file of uploadedFiles) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }

        console.error("Update variant error:", error);

        res.redirect(
            `/admin/product-variants?error=${encodeURIComponent(error.message)}`
        );
    }
};

// Update stock quantity
const updateVariantStock = async (req, res) => {
    try {
        await productVariantService.updateVariantStock(
            req.params.id,
            req.body.stock
        );

        res.redirect(
            "/admin/product-variants?success=Stock%20updated%20successfully"
        );
    } catch (error) {
        console.error("Update variant stock error:", error);

        res.redirect(
            `/admin/product-variants?error=${encodeURIComponent(error.message)}`
        );
    }
};


// Activate or deactivate a variant
const toggleVariantStatus = async (req, res) => {
    try {
        const variant = await productVariantService.toggleVariantStatus(
            req.params.id
        );

        const message = variant.isActive
            ? "Variant activated successfully"
            : "Variant deactivated successfully";

        res.redirect(
            `/admin/product-variants?success=${encodeURIComponent(message)}`
        );
    } catch (error) {
        console.error("Toggle variant status error:", error);

        res.redirect(
            `/admin/product-variants?error=${encodeURIComponent(error.message)}`
        );
    }
};


// Archive a variant
const archiveVariant = async (req, res) => {
    try {
        await productVariantService.archiveVariant(req.params.id);

        res.redirect(
            "/admin/product-variants?success=Variant%20archived%20successfully"
        );
    } catch (error) {
        console.error("Archive variant error:", error);

        res.redirect(
            `/admin/product-variants?error=${encodeURIComponent(error.message)}`
        );
    }
};

module.exports = {
    renderVariants,
    createVariant,
    updateVariant,
    updateVariantStock,
    toggleVariantStatus,
    archiveVariant
};