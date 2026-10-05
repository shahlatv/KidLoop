const express = require("express");

const router = express.Router();

const userController =
    require("../controllers/userController");

const addressController =
    require("../controllers/addressController");

const userService =
    require("../services/userService");

const userAuth =
    require("../middleware/userAuth");


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


module.exports = router;