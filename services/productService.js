const mongoose = require("mongoose");

const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const ProductVariant = require("../models/productVariantModel");

// Create a product
const createProduct = async (productData) => {
    const {
        name,
        description,
        category,
        brand,
        price,
        discount,
        highlights
    } = productData;

    if (!name || !name.trim()) {
        throw new Error("Product name is required");
    }

    if (!description || !description.trim()) {
        throw new Error("Product description is required");
    }

    if (!category) {
        throw new Error("Please select a category");
    }

    if (
        price === undefined ||
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
    ) {
        throw new Error("Please enter a valid product price");
    }

    const existingCategory = await Category.findOne({
        _id: category,
        isActive: true,
        isDeleted: false
    });

    if (!existingCategory) {
        throw new Error("Selected category is unavailable");
    }

    const product = await Product.create({
        name: name.trim(),
        description: description.trim(),
        category,
        brand: brand || null,
        price: Number(price),
        discount:
            discount === undefined || discount === ""
                ? 0
                : Number(discount),
        highlights: Array.isArray(highlights)
            ? highlights
            : highlights
                ? [highlights]
                : []
    });

    return product;
};

// Get all non-archived products for admin
const getAllProducts = async () => {
    return Product.find({
        isDeleted: false
    })
        .populate("category", "name")
        .sort({ createdAt: -1 });
};

// Get one product
const getProductById = async (id) => {
    const product = await Product.findOne({
        _id: id,
        isDeleted: false
    }).populate("category", "name");

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};

// Update product information
const updateProduct = async (id, productData) => {
    const product = await getProductById(id);

    const allowedFields = [
        "name",
        "description",
        "category",
        "brand",
        "price",
        "discount",
        "highlights"
    ];

    for (const field of allowedFields) {
        if (productData[field] !== undefined) {
            product[field] = productData[field];
        }
    }

    if (productData.name !== undefined) {
        if (!String(productData.name).trim()) {
            throw new Error("Product name is required");
        }

        product.name = String(productData.name).trim();
    }

    if (productData.description !== undefined) {
        if (!String(productData.description).trim()) {
            throw new Error("Product description is required");
        }

        product.description = String(productData.description).trim();
    }

    if (productData.category !== undefined) {
        const category = await Category.findOne({
            _id: productData.category,
            isActive: true,
            isDeleted: false
        });

        if (!category) {
            throw new Error("Selected category is unavailable");
        }
    }

    if (productData.price !== undefined) {
        const price = Number(productData.price);

        if (!Number.isFinite(price) || price < 0) {
            throw new Error("Please enter a valid product price");
        }

        product.price = price;
    }

    if (productData.discount !== undefined) {
        const discount = Number(productData.discount);

        if (
            !Number.isFinite(discount) ||
            discount < 0 ||
            discount > 100
        ) {
            throw new Error("Discount must be between 0 and 100");
        }

        product.discount = discount;
    }

    await product.save();

    return product;
};

// List or unlist a product
const toggleProductListing = async (id) => {
    const product = await getProductById(id);

    product.isListed = !product.isListed;

    await product.save();

    return product;
};

// Archive a product instead of permanently deleting it
const archiveProduct = async (id) => {
    const product = await getProductById(id);

    product.isDeleted = true;
    product.isListed = false;

    await product.save();

    // Deactivate all associated variants too.
    await ProductVariant.updateMany(
        {
            product: product._id,
            isDeleted: false
        },
        {
            $set: {
                isActive: false,
                isDeleted: true
            }
        }
    );

    return product;
};

// Get products for the customer-facing shop.
// Supports search, category filtering, price filtering,
// sorting, backend pagination and out-of-stock products.
const getShopProducts = async (queryParams = {}) => {
    const {
        search = "",
        category = "",
        minPrice = "",
        maxPrice = "",
        sort = "newest",
        page = 1
    } = queryParams;

    const currentPage = Math.max(
        1,
        parseInt(page, 10) || 1
    );

    const limit = 12;
    const skip = (currentPage - 1) * limit;

    // Only listed, non-archived products.
    const filter = {
        isListed: true,
        isDeleted: false
    };

    // Search by product name.
    const searchText = String(search).trim();

    if (searchText) {
        const escapedSearch = searchText.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filter.name = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    // Filter by category.
    if (
        category &&
        mongoose.Types.ObjectId.isValid(category)
    ) {
        filter.category = new mongoose.Types.ObjectId(category);
    }

    // Filter by price range.
    if (minPrice !== "" || maxPrice !== "") {
        filter.price = {};

        if (
            minPrice !== "" &&
            Number.isFinite(Number(minPrice))
        ) {
            filter.price.$gte = Math.max(
                0,
                Number(minPrice)
            );
        }

        if (
            maxPrice !== "" &&
            Number.isFinite(Number(maxPrice))
        ) {
            filter.price.$lte = Math.max(
                0,
                Number(maxPrice)
            );
        }
    }

    // Sorting options.
    const sortOptions = {
        "price-asc": {
            price: 1,
            name: 1
        },
        "price-desc": {
            price: -1,
            name: 1
        },
        "name-asc": {
            name: 1
        },
        "name-desc": {
            name: -1
        },
        newest: {
            createdAt: -1
        }
    };

    const sortBy = sortOptions[sort] || sortOptions.newest;

    // Build aggregation pipeline.
    const pipeline = [
        {
            $match: filter
        },

        // Get the product category.
        {
            $lookup: {
                from: Category.collection.name,
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },

        {
            $unwind: "$category"
        },

        // Exclude inactive or archived categories.
        {
            $match: {
                "category.isActive": true,
                "category.isDeleted": false
            }
        },

        // Get active variants for each product.
        // Zero-stock variants are intentionally included.
        {
            $lookup: {
                from: ProductVariant.collection.name,
                let: {
                    productId: "$_id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            "$product",
                                            "$$productId"
                                        ]
                                    },
                                    {
                                        $eq: [
                                            "$isActive",
                                            true
                                        ]
                                    },
                                    {
                                        $eq: [
                                            "$isDeleted",
                                            false
                                        ]
                                    }
                                ]
                            }
                        }
                    },

                    {
                        $sort: {
                            createdAt: 1
                        }
                    },

                    {
                        $project: {
                            color: 1,
                            size: 1,
                            stock: 1,
                            images: 1
                        }
                    }
                ],
                as: "variants"
            }
        },

        // Exclude products without active variants.
        // Products with active variants and zero stock remain visible.
        {
            $match: {
                "variants.0": {
                    $exists: true
                }
            }
        },

        // Determine stock status and select a variant image.
        {
            $addFields: {
                inStock: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$variants",
                                    as: "variant",
                                    cond: {
                                        $gt: [
                                            "$$variant.stock",
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        0
                    ]
                },

                displayImage: {
                    $let: {
                        vars: {
                            variantsWithImages: {
                                $filter: {
                                    input: "$variants",
                                    as: "variant",
                                    cond: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $ifNull: [
                                                        "$$variant.images",
                                                        []
                                                    ]
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        },

                        in: {
                            $arrayElemAt: [
                                {
                                    $arrayElemAt: [
                                        "$$variantsWithImages.images",
                                        0
                                    ]
                                },
                                0
                            ]
                        }
                    }
                }
            }
        },

        // In-stock products first.
        // Out-of-stock products appear at the end.
        // The user's selected sorting is preserved within each group.
        {
            $sort: {
                inStock: -1,
                ...sortBy
            }
        },

        // Count and paginate inside MongoDB.
        {
            $facet: {
                metadata: [
                    {
                        $count: "total"
                    }
                ],

                products: [
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ]
            }
        }
    ];

    const [result, categories] = await Promise.all([
        Product.aggregate(pipeline),

        Category.find({
            isActive: true,
            isDeleted: false
        })
            .select("name")
            .sort({
                name: 1
            })
            .lean()
    ]);

    const data = result[0] || {
        metadata: [],
        products: []
    };

    const products = data.products || [];

    const totalProducts =
        data.metadata[0]?.total || 0;

    return {
        products,
        categories,
        currentPage,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        search: searchText,
        selectedCategory: category,
        minPrice,
        maxPrice,
        sort
    };
};

// Validate MongoDB ObjectId without throwing an error.
function mongooseIsValidObjectId(id) {
    return /^[a-f\d]{24}$/i.test(id);
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    toggleProductListing,
    archiveProduct,
    getShopProducts
};