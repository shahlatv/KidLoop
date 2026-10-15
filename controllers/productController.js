const productService = require("../services/productService");

// Display product management page
const renderProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        const Category = require("../models/categoryModel");

        const categories = await Category.find({
            isActive: true,
            isDeleted: false
        }).sort({ name: 1 });

        res.render("admin/products", {
            products,
            categories,
            success: req.query.success || "",
            error: req.query.error || ""
        });
    } catch (error) {
        console.error("Render products error:", error);
        res.status(500).send("Unable to load products");
    }
};

// Create product
const createProduct = async (req, res) => {
    try {
        await productService.createProduct(req.body);

        res.redirect(
            "/admin/products?success=Product%20created%20successfully"
        );
    } catch (error) {
        console.error("Create product error:", error);

        res.redirect(
            `/admin/products?error=${encodeURIComponent(error.message)}`
        );
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        await productService.updateProduct(
            req.params.id,
            req.body
        );

        res.redirect(
            "/admin/products?success=Product%20updated%20successfully"
        );
    } catch (error) {
        console.error("Update product error:", error);

        res.redirect(
            `/admin/products?error=${encodeURIComponent(error.message)}`
        );
    }
};

// List or unlist product
const toggleProductListing = async (req, res) => {
    try {
        const product = await productService.toggleProductListing(
            req.params.id
        );

        const message = product.isListed
            ? "Product listed successfully"
            : "Product unlisted successfully";

        res.redirect(
            `/admin/products?success=${encodeURIComponent(message)}`
        );
    } catch (error) {
        console.error("Toggle product listing error:", error);

        res.redirect(
            `/admin/products?error=${encodeURIComponent(error.message)}`
        );
    }
};

// Archive product
const archiveProduct = async (req, res) => {
    try {
        await productService.archiveProduct(req.params.id);

        res.redirect(
            "/admin/products?success=Product%20archived%20successfully"
        );
    } catch (error) {
        console.error("Archive product error:", error);

        res.redirect(
            `/admin/products?error=${encodeURIComponent(error.message)}`
        );
    }
};

module.exports = {
    renderProducts,
    createProduct,
    updateProduct,
    toggleProductListing,
    archiveProduct
};