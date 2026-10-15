const productService = require("../services/productService");
const ProductVariant = require("../models/productVariantModel");

const renderShop = async (req, res) => {
    try {
        // Get products using the existing search, filters, sorting and pagination.
        const shopData = await productService.getShopProducts(req.query);

        const productIds = shopData.products.map(product => product._id);

        // Get available variants for the products on this page.
        const variants = await ProductVariant.find({
            product: { $in: productIds },
            isActive: true,
            isDeleted: false,
            stock: { $gt: 0 }
        })
            .select("_id product images color size stock")
            .sort({ createdAt: -1 })
            .lean();

        // Attach an available variant to each product.
        const productsWithImages = shopData.products.map(product => {
            const variant = variants.find(
                item => String(item.product) === String(product._id)
            );

            return {
                ...product,
                variantId: variant ? variant._id : null,
                images: variant ? variant.images : [],
                availableStock: variant ? variant.stock : 0,
                availableColor: variant ? variant.color : "",
                availableSize: variant ? variant.size : ""
            };
        });

        // Preserve existing search, filter and sorting options in pagination.
        const queryForPagination = {};

        for (const key of [
            "search",
            "category",
            "minPrice",
            "maxPrice",
            "sort"
        ]) {
            if (req.query[key] !== undefined && req.query[key] !== "") {
                queryForPagination[key] = req.query[key];
            }
        }

        res.render("user/shop", {
            ...shopData,
            products: productsWithImages,
            queryForPagination
        });

    } catch (error) {
        console.error("Render shop error:", error);

        res.status(500).send(
            "Unable to load the shop. Please try again."
        );
    }
};

module.exports = {
    renderShop
};