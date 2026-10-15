const mongoose = require("mongoose");
const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");

const renderProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        // Validate the product ID.
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.redirect("/shop");
        }

        // Find only listed, non-archived products
        // whose category is active and available.
        const product = await Product.findOne({
            _id: productId,
            isListed: true,
            isDeleted: false
        })
            .populate({
                path: "category",
                match: {
                    isActive: true,
                    isDeleted: false
                },
                select: "name"
            })
            .lean();

        // Redirect if the product is unavailable.
        if (!product || !product.category) {
            return res.redirect("/shop");
        }

        // Find available variants.
        const variants = await ProductVariant.find({
            product: product._id,
            isActive: true,
            isDeleted: false,
            stock: { $gt: 0 }
        })
            .select("color size images stock")
            .lean();

        // Redirect if no variant is available.
        if (variants.length === 0) {
            return res.redirect("/shop");
        }

        // Find related products in the same category.
        const relatedProducts = await Product.find({
            _id: {
                $ne: product._id,
                $in: await ProductVariant.distinct("product", {
                    isActive: true,
                    isDeleted: false,
                    stock: { $gt: 0 }
                })
            },
            category: product.category._id,
            isListed: true,
            isDeleted: false
        })
            .limit(4)
            .select("name price discount category")
            .populate("category", "name")
            .lean();

        // Attach images from an available variant
        // to each related product.
        const relatedWithImages = await Promise.all(
            relatedProducts.map(async (item) => {
                const variant = await ProductVariant.findOne({
                    product: item._id,
                    isActive: true,
                    isDeleted: false,
                    stock: { $gt: 0 }
                })
                    .select("images")
                    .lean();

                return {
                    ...item,
                    images: variant ? variant.images : []
                };
            })
        );

        res.render("user/product-details", {
            product,
            variants,
            relatedProducts: relatedWithImages
        });

    } catch (error) {
        console.error("Product details error:", error);

        res.status(500).send(
            "Unable to load product details. Please try again."
        );
    }
};

module.exports = {
    renderProductDetails
};