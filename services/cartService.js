const mongoose = require("mongoose");

const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");
const Category = require("../models/categoryModel");

// Maximum quantity allowed per product variant
const MAX_PURCHASE_QUANTITY = 5;


// Validate product and variant availability
const getAvailableVariant = async (productId, variantId) => {
    if (
        !mongoose.Types.ObjectId.isValid(productId) ||
        !mongoose.Types.ObjectId.isValid(variantId)
    ) {
        throw new Error("Invalid product or variant.");
    }

    const product = await Product.findOne({
        _id: productId,
        isListed: true,
        isDeleted: false
    }).lean();

    if (!product) {
        throw new Error("This product is unavailable.");
    }

    const category = await Category.findOne({
        _id: product.category,
        isActive: true,
        isDeleted: false
    }).lean();

    if (!category) {
        throw new Error("This product's category is unavailable.");
    }

    const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
        isDeleted: false
    }).lean();

    if (!variant) {
        throw new Error("This product variant is unavailable.");
    }

    if (variant.stock <= 0) {
        throw new Error("This product is out of stock.");
    }

    return { product, variant };
};


// Get the customer's cart
// Keep cart items visible even if a product becomes unavailable.
const getCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId })
        .populate({
            path: "items.product",
            select: "name price discount isListed isDeleted category"
        })
        .populate({
            path: "items.variant",
            select: "color size images stock isActive isDeleted"
        })
        .lean();

    if (!cart) {
        return {
            user: userId,
            items: []
        };
    }

    // Attach availability information without removing cart items.
    const items = await Promise.all(
        cart.items.map(async (item) => {
            const product = item.product;
            const variant = item.variant;

            let categoryAvailable = false;

            if (product && product.category) {
                const category = await Category.findOne({
                    _id: product.category,
                    isActive: true,
                    isDeleted: false
                })
                    .select("_id")
                    .lean();

                categoryAvailable = Boolean(category);
            }

            const productAvailable = Boolean(
                product &&
                product.isListed &&
                !product.isDeleted &&
                categoryAvailable
            );

            const variantAvailable = Boolean(
                variant &&
                variant.isActive &&
                !variant.isDeleted
            );

            const available =
                productAvailable &&
                variantAvailable &&
                variant.stock > 0;

            let unavailableReason = "";

            if (!product) {
                unavailableReason = "Product no longer exists.";
            } else if (!productAvailable) {
                unavailableReason = "This product is unavailable.";
            } else if (!variant) {
                unavailableReason = "Product variant no longer exists.";
            } else if (!variantAvailable) {
                unavailableReason = "This variant is unavailable.";
            } else if (variant.stock <= 0) {
                unavailableReason = "Out of stock.";
            } else if (item.quantity > variant.stock) {
                unavailableReason =
                    `Only ${variant.stock} item(s) are currently available.`;
            } else if (item.quantity > MAX_PURCHASE_QUANTITY) {
                unavailableReason =
                    `Maximum ${MAX_PURCHASE_QUANTITY} units allowed per variant.`;
            }

            return {
                ...item,
                available,
                unavailableReason,
                maxPurchaseQuantity: Math.min(
                    MAX_PURCHASE_QUANTITY,
                    variant && Number.isFinite(variant.stock)
                        ? Math.max(0, variant.stock)
                        : 0
                )
            };
        })
    );

    return {
        ...cart,
        items
    };
};


// Add a product variant to the cart
const addToCart = async (
    userId,
    productId,
    variantId,
    quantity = 1
) => {
    const requestedQuantity = Number(quantity);

    if (
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity < 1
    ) {
        throw new Error(
            "Quantity must be a positive whole number."
        );
    }

    const { variant } = await getAvailableVariant(
        productId,
        variantId
    );

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = new Cart({
            user: userId,
            items: []
        });
    }

    const existingItem = cart.items.find(
        item =>
            item.product.toString() === productId.toString() &&
            item.variant.toString() === variantId.toString()
    );

    const currentQuantity = existingItem
        ? existingItem.quantity
        : 0;

    const newQuantity = currentQuantity + requestedQuantity;

    if (newQuantity > MAX_PURCHASE_QUANTITY) {
        throw new Error(
            `You can purchase a maximum of ${MAX_PURCHASE_QUANTITY} units of this variant.`
        );
    }

    if (newQuantity > variant.stock) {
        throw new Error(
            `Only ${variant.stock} item(s) are available in stock.`
        );
    }

    if (existingItem) {
        existingItem.quantity = newQuantity;
    } else {
        cart.items.push({
            product: productId,
            variant: variantId,
            quantity: requestedQuantity
        });
    }

    await cart.save();

    return getCart(userId);
};


// Update a cart item's quantity
const updateCartQuantity = async (
    userId,
    itemId,
    quantity
) => {
    const newQuantity = Number(quantity);

    if (
        !Number.isInteger(newQuantity) ||
        newQuantity < 1
    ) {
        throw new Error(
            "Quantity must be a positive whole number."
        );
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        throw new Error("Invalid cart item.");
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new Error("Cart not found.");
    }

    const item = cart.items.id(itemId);

    if (!item) {
        throw new Error("Cart item not found.");
    }

    const { variant } = await getAvailableVariant(
        item.product,
        item.variant
    );

    if (newQuantity > MAX_PURCHASE_QUANTITY) {
        throw new Error(
            `You can purchase a maximum of ${MAX_PURCHASE_QUANTITY} units of this variant.`
        );
    }

    if (newQuantity > variant.stock) {
        throw new Error(
            `Only ${variant.stock} item(s) are available in stock.`
        );
    }

    item.quantity = newQuantity;

    await cart.save();

    return getCart(userId);
};


// Remove an item from the cart
const removeFromCart = async (userId, itemId) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        throw new Error("Invalid cart item.");
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
        throw new Error("Cart not found.");
    }

    const item = cart.items.id(itemId);

    if (!item) {
        throw new Error("Cart item not found.");
    }

    item.deleteOne();

    await cart.save();

    return getCart(userId);
};


module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
};