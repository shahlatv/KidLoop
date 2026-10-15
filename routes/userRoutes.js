const express = require("express");

const router = express.Router();

const userController =
    require("../controllers/userController");

const addressController =
    require("../controllers/addressController");
const shopController = require("../controllers/shopController");
const productDetailsController =
    require("../controllers/productDetailsController");
const cartController =
    require("../controllers/cartController");
const wishlistController =
    require("../controllers/wishlistController");

const userService =
    require("../services/userService");

const userAuth =
    require("../middleware/userAuth");

const profileUpload = require("../middleware/profileUpload");

/* =========================================
   PROFILE
========================================= */

router.get(
    "/profile",
    userAuth,
    userController.getProfile
);


router.get(
    "/profile/edit",
    userAuth,
    async (req, res) => {

        try {

            const user =
                await userService.getProfile(
                    req.session.userId
                );

            res.render(
                "user/edit-profile",
                { user }
            );

        } catch (error) {

            console.error(
                "Edit profile page error:",
                error
            );

            res.status(500).send(
                "Unable to load edit profile page"
            );

        }

    }
);


router.put(
    "/profile",
    userAuth,
    userController.updateProfile
);

router.post(
    "/profile/image",
    userAuth,
    (req, res, next) => {
        profileUpload.single("profileImage")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.code === "LIMIT_FILE_SIZE"
                        ? "Image size must not exceed 2 MB."
                        : error.message
                });
            }

            next();
        });
    },
    userController.uploadProfileImage
);

/* =========================================
   CHANGE PASSWORD
========================================= */


/*
 * This GET route opens the Change Password page.
 */

router.get(
    "/change-password",
    userAuth,
    (req, res) => {

        res.render(
            "user/change-password"
        );

    }
);


/*
 * This PUT route actually changes
 * the user's password.
 */

router.put(
    "/change-password",
    userAuth,
    userController.changePassword
);


/* =========================================
   CHANGE EMAIL
========================================= */

router.get(
    "/change-email",
    userAuth,
    (req, res) => {

        res.render(
            "user/change-email"
        );

    }
);


router.put(
    "/change-email",
    userAuth,
    userController.changeEmail
);


router.put(
    "/verify-email-otp",
    userAuth,
    userController.verifyEmailOTP
);


/* =========================================
   ADDRESSES
========================================= */
router.get(
     "/addresses/manage",
    userAuth,
    (req, res) => {
        res.render("user/addresses");
    }
);

router.post(
    "/addresses",
    userAuth,
    addressController.addAddress
);


router.get(
    "/addresses",
    userAuth,
    addressController.getAddresses
);


router.put(
    "/addresses/:id",
    userAuth,
    addressController.updateAddress
);


router.delete(
    "/addresses/:id",
    userAuth,
    addressController.deleteAddress
);

/* =========================================
   CUSTOMER SHOP
========================================= */

router.get(
    "/shop",
    shopController.renderShop
);

/* =========================================
   PRODUCT DETAILS
========================================= */

router.get(
    "/products/:id",
    productDetailsController.renderProductDetails
);

/* =========================================
   CART MANAGEMENT
========================================= */

// Display cart
router.get(
    "/cart",
    userAuth,
    cartController.getCart
);

// Add product to cart
router.post(
    "/cart/add",
    userAuth,
    cartController.addToCart
);

// Update cart item quantity
router.post(
    "/cart/update/:itemId",
    userAuth,
    cartController.updateCartQuantity
);

// Remove item from cart
router.post(
    "/cart/remove/:itemId",
    userAuth,
    cartController.removeFromCart
);


/* =========================================
   WISHLIST MANAGEMENT
========================================= */

// Display wishlist
router.get(
    "/wishlist",
    userAuth,
    wishlistController.getWishlist
);

// Add product to wishlist
router.post(
    "/wishlist/add",
    userAuth,
    wishlistController.addToWishlist
);

// Remove product from wishlist
router.post(
    "/wishlist/remove",
    userAuth,
    wishlistController.removeFromWishlist
);

module.exports = router;