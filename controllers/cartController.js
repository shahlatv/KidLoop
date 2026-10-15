const cartService = require("../services/cartService");
const wishlistService = require("../services/wishlistService");

// Display the cart page
const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.session.userId);

        res.render("user/cart", {
            cart,
            error: req.query.error || null,
            success: req.query.success || null
        });

    } catch (error) {
        console.error("Get cart error:", error);

        res.status(500).send(
            "Unable to load your cart. Please try again."
        );
    }
};


// Add product variant to cart
const addToCart = async (req, res) => {
    try {
        const { productId, variantId, quantity, source } = req.body;

        // First, add the product to the cart
        await cartService.addToCart(
            req.session.userId,
            productId,
            variantId,
            quantity === undefined ? 1 : quantity
        );

        // If the request came from the wishlist,
        // remove the product only after adding it successfully
        if (source === "wishlist") {
            try {
                await wishlistService.removeFromWishlist(
                    req.session.userId,
                    productId
                );
            } catch (wishlistError) {
                // The cart addition succeeded, so don't report it as failed.
                console.error(
                    "Product added to cart, but wishlist removal failed:",
                    wishlistError
                );
            }

            return res.redirect("/user/wishlist?success=addedToCart");
        }

        return res.redirect("/user/cart?success=added");

    } catch (error) {
        console.error("Add to cart error:", error);

        const errorMessage = encodeURIComponent(
            error.message || "Unable to add this item to your cart."
        );

        if (req.body.source === "wishlist") {
            return res.redirect(
                "/user/wishlist?error=" + errorMessage
            );
        }

        return res.redirect("/user/cart?error=" + errorMessage);
    }
};


// Update quantity
const updateCartQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;

        await cartService.updateCartQuantity(
            req.session.userId,
            req.params.itemId,
            quantity
        );

        return res.redirect("/user/cart?success=updated");

    } catch (error) {
        console.error("Update cart quantity error:", error);

        return res.redirect(
            "/user/cart?error=" +
            encodeURIComponent(
                error.message || "Unable to update the cart quantity."
            )
        );
    }
};


// Remove item
const removeFromCart = async (req, res) => {
    try {
        await cartService.removeFromCart(
            req.session.userId,
            req.params.itemId
        );

        return res.redirect("/user/cart?success=removed");

    } catch (error) {
        console.error("Remove from cart error:", error);

        return res.redirect(
            "/user/cart?error=" +
            encodeURIComponent(
                error.message || "Unable to remove this item."
            )
        );
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
};