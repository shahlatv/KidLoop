const wishlistService = require("../services/wishlistService");

// Display wishlist
const getWishlist = async (req, res) => {
    try {
        const wishlist = await wishlistService.getWishlist(
            req.session.userId
        );

        res.render("user/wishlist", {
            wishlist,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error("Get wishlist error:", error);

        res.status(500).send(
            "Unable to load your wishlist. Please try again."
        );
    }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        await wishlistService.addToWishlist(
            req.session.userId,
            productId
        );

        return res.redirect("/user/wishlist?success=added");
    } catch (error) {
        console.error("Add wishlist error:", error);

        return res.redirect(
            "/user/wishlist?error=" +
            encodeURIComponent(error.message)
        );
    }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        await wishlistService.removeFromWishlist(
            req.session.userId,
            productId
        );

        return res.redirect("/user/wishlist?success=removed");
    } catch (error) {
        console.error("Remove wishlist error:", error);

        return res.redirect(
            "/user/wishlist?error=" +
            encodeURIComponent(error.message)
        );
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};