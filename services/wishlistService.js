const mongoose = require("mongoose");

const Wishlist = require("../models/Wishlist");
const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");

// Get a user's wishlist
const getWishlist = async (userId) => {
    let wishlist = await Wishlist.findOne({ user: userId })
        .populate({
            path: "products.product",
            populate: {
                path: "category"
            }
        });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: userId,
            products: []
        });
    }

    // Fetch active variants for each product.
    const productsWithVariants = await Promise.all(
        wishlist.products.map(async (item) => {
            const product = item.product;

            if (!product) {
                return null;
            }

            const variants = await ProductVariant.find({
                product: product._id,
                isActive: true,
                isDeleted: false
            }).select("color size stock images");

            const activeVariants = variants.filter(
                (variant) => Number(variant.stock) > 0
            );

            const firstImageVariant = variants.find(
                (variant) =>
                    Array.isArray(variant.images) &&
                    variant.images.length > 0
            );

            return {
                product,
                addedAt: item.addedAt,
                variants,
                inStock: activeVariants.length > 0,
                displayImage: firstImageVariant?.images?.[0] || null
            };
        })
    );

    return {
        ...wishlist.toObject(),
        products: productsWithVariants.filter(Boolean)
    };
};

// Add a product to the wishlist without duplicates
const addToWishlist = async (userId, productId) => {
    if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
    ) {
        throw new Error("Invalid user or product.");
    }

    const product = await Product.findOne({
        _id: productId,
        isListed: true,
        isDeleted: false
    });

    if (!product) {
        throw new Error("Product is unavailable.");
    }

    // Create the wishlist if it doesn't exist.
    await Wishlist.updateOne(
        { user: userId },
        {
            $setOnInsert: {
                user: userId,
                products: []
            }
        },
        { upsert: true }
    );

    // Add the product only if it isn't already present.
    const result = await Wishlist.updateOne(
        {
            user: userId,
            "products.product": { $ne: product._id }
        },
        {
            $push: {
                products: {
                    product: product._id,
                    addedAt: new Date()
                }
            }
        }
    );

    if (result.modifiedCount === 0) {
        const existingWishlist = await Wishlist.findOne({
            user: userId,
            "products.product": product._id
        });

        if (existingWishlist) {
            throw new Error("This product is already in your wishlist.");
        }

        throw new Error("Unable to add this product. Please try again.");
    }

    return Wishlist.findOne({ user: userId });
};

// Remove a product from the wishlist
const removeFromWishlist = async (userId, productId) => {
    if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
    ) {
        throw new Error("Invalid user or product.");
    }

    const wishlist = await Wishlist.findOneAndUpdate(
        { user: userId },
        {
            $pull: {
                products: {
                    product: productId
                }
            }
        },
        { new: true }
    );

    return wishlist;
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};