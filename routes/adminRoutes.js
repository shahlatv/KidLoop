const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");
const productController = require("../controllers/productController");
const productVariantController = require("../controllers/productVariantController");
const {
    uploadProductVariantImages,
    processProductVariantImages
} = require("../middleware/productVariantUpload");const adminAuth = require("../middleware/adminAuth");
const uploadCategoryImage = require("../middleware/categoryUpload");

// ==================== ADMIN AUTHENTICATION ====================

router.get("/login", (req, res) => {
    res.render("admin/login");
});

router.post("/login", adminController.login);

router.post("/logout", adminAuth, adminController.logout);

// ==================== ADMIN DASHBOARD ====================

router.get("/dashboard", adminAuth, (req, res) => {
    res.render("admin/dashboard");
});

// ==================== USER MANAGEMENT ====================

router.get("/user-management", adminAuth, (req, res) => {
    res.render("admin/users");
});

router.get("/users", adminAuth, adminController.getUsers);

router.patch(
    "/users/:id/block",
    adminAuth,
    adminController.toggleUserBlock
);

// ==================== CATEGORY MANAGEMENT ====================

// Display category management page
router.get(
    "/categories",
    adminAuth,
    categoryController.renderCategories
);

// Create a category with image upload
router.post(
    "/categories",
    adminAuth,
    uploadCategoryImage.single("image"),
    categoryController.createCategory
);

// Update category name and optional image
router.post(
    "/categories/:id/edit",
    adminAuth,
    uploadCategoryImage.single("image"),
    categoryController.updateCategory
);

// Activate or deactivate a category
router.post(
    "/categories/:id/toggle-status",
    adminAuth,
    categoryController.toggleCategoryStatus
);

// Archive a category
router.post(
    "/categories/:id/archive",
    adminAuth,
    categoryController.archiveCategory
);

// Product Management
router.get("/products", adminAuth, productController.renderProducts);

router.post("/products", adminAuth, productController.createProduct);

router.post(
    "/products/:id/edit",
    adminAuth,
    productController.updateProduct
);

router.post(
    "/products/:id/toggle-listing",
    adminAuth,
    productController.toggleProductListing
);

router.post(
    "/products/:id/archive",
    adminAuth,
    productController.archiveProduct
);

// Product Variant Management
router.get(
    "/product-variants",
    adminAuth,
    productVariantController.renderVariants
);

router.post(
    "/product-variants",
    adminAuth,
    uploadProductVariantImages.array("images", 10),
    processProductVariantImages,
    productVariantController.createVariant
);

// Edit product variant
router.post(
    "/product-variants/:id/edit",
    adminAuth,
    uploadProductVariantImages.array("images", 10),
    processProductVariantImages,
    productVariantController.updateVariant
);

router.post(
    "/product-variants/:id/update-stock",
    adminAuth,
    productVariantController.updateVariantStock
);

router.post(
    "/product-variants/:id/toggle-status",
    adminAuth,
    productVariantController.toggleVariantStatus
);

router.post(
    "/product-variants/:id/archive",
    adminAuth,
    productVariantController.archiveVariant
);

module.exports = router;