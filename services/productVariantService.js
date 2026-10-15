const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");

const MIN_IMAGES = 3;
const MAX_IMAGES = 10;

// Create a product variant
const createVariant = async (variantData, imagePaths = []) => {
    const { product, color, size, stock } = variantData;

    if (!product) {
        throw new Error("Please select a product");
    }

    if (typeof color !== "string" || !color.trim()) {
        throw new Error("Color is required");
    }

    if (typeof size !== "string" || !size.trim()) {
        throw new Error("Size is required");
    }

    if (
        stock === undefined ||
        stock === "" ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
    ) {
        throw new Error("Stock must be a non-negative whole number");
    }

    const existingProduct = await Product.findOne({
        _id: product,
        isDeleted: false
    });

    if (!existingProduct) {
        throw new Error(
            "Selected product does not exist or is archived"
        );
    }

    // Validate image count
    if (!Array.isArray(imagePaths) || imagePaths.length < MIN_IMAGES) {
        throw new Error(
            "Please upload at least 3 images for this variant"
        );
    }

    if (imagePaths.length > MAX_IMAGES) {
        throw new Error(
            "You can upload a maximum of 10 images for a variant"
        );
    }

    // Prevent duplicate colour-size combinations
    const existingVariant = await ProductVariant.findOne({
        product,
        color: color.trim(),
        size: size.trim(),
        isDeleted: false
    });

    if (existingVariant) {
        throw new Error(
            "This color and size combination already exists for this product"
        );
    }

    return ProductVariant.create({
        product,
        color: color.trim(),
        size: size.trim(),
        stock: Number(stock),
        images: imagePaths,
        isActive: true
    });
};


// Get variants for one product
const getVariantsByProduct = async (productId) => {
    return ProductVariant.find({
        product: productId,
        isDeleted: false
    })
        .populate("product", "name")
        .sort({ createdAt: -1 });
};


// Get all non-archived variants
const getAllVariants = async () => {
    return ProductVariant.find({
        isDeleted: false
    })
        .populate("product", "name")
        .sort({ createdAt: -1 });
};


// Find a variant by ID
const getVariantById = async (id) => {
    const variant = await ProductVariant.findOne({
        _id: id,
        isDeleted: false
    }).populate("product", "name");

    if (!variant) {
        throw new Error("Product variant not found");
    }

    return variant;
};


// Update product variant details
const updateVariant = async (
    id,
    variantData,
    newImagePaths = []
) => {
    const variant = await getVariantById(id);

    const { color, size, stock } = variantData;

    if (!Array.isArray(newImagePaths)) {
        throw new Error("Invalid image upload data");
    }

    // Update colour
    if (color !== undefined) {
        if (typeof color !== "string" || !color.trim()) {
            throw new Error("Color is required");
        }

        variant.color = color.trim();
    }

    // Update size
    if (size !== undefined) {
        if (typeof size !== "string" || !size.trim()) {
            throw new Error("Size is required");
        }

        variant.size = size.trim();
    }

    // Update stock
    if (stock !== undefined) {
        if (
            stock === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            throw new Error(
                "Stock must be a non-negative whole number"
            );
        }

        variant.stock = Number(stock);
    }

    const existingImageCount = Array.isArray(variant.images)
        ? variant.images.length
        : 0;

    // Enforce maximum of 10 images in total
    if (existingImageCount + newImagePaths.length > MAX_IMAGES) {
        throw new Error(
            `This variant already has ${existingImageCount} image(s). You can have a maximum of 10 images in total.`
        );
    }

    // Preserve existing images and append new images
    if (newImagePaths.length > 0) {
        variant.images.push(...newImagePaths);
    }

    // Validate total image count
    if (variant.images.length < MIN_IMAGES) {
        throw new Error(
            "A variant must have at least 3 images"
        );
    }

    if (variant.images.length > MAX_IMAGES) {
        throw new Error(
            "A variant can have a maximum of 10 images"
        );
    }

    // Prevent duplicate colour-size combinations
    const duplicate = await ProductVariant.findOne({
        _id: { $ne: variant._id },
        product: variant.product._id || variant.product,
        color: variant.color,
        size: variant.size,
        isDeleted: false
    });

    if (duplicate) {
        throw new Error(
            "This color and size combination already exists for this product"
        );
    }

    await variant.save();

    return variant;
};


// Update stock quantity
const updateVariantStock = async (id, stock) => {
    if (
        stock === undefined ||
        stock === "" ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
    ) {
        throw new Error(
            "Stock must be a non-negative whole number"
        );
    }

    const variant = await getVariantById(id);

    variant.stock = Number(stock);

    await variant.save();

    return variant;
};


// Activate or deactivate a variant
const toggleVariantStatus = async (id) => {
    const variant = await getVariantById(id);

    variant.isActive = !variant.isActive;

    await variant.save();

    return variant;
};


// Archive a variant
const archiveVariant = async (id) => {
    const variant = await getVariantById(id);

    variant.isDeleted = true;
    variant.isActive = false;

    await variant.save();

    return variant;
};


module.exports = {
    createVariant,
    getVariantsByProduct,
    getAllVariants,
    getVariantById,
    updateVariant,
    updateVariantStock,
    toggleVariantStatus,
    archiveVariant
};