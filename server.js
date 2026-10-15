const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const methodOverride = require("method-override");

// Load environment variables FIRST
dotenv.config();

const connectDB = require("./config/db");
const passport = require("./config/passport");

const User = require("./models/User");
const Cart = require("./models/cartModel");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

const PORT = process.env.PORT || 3000;


// ==============================
// Middleware
// ==============================

// Prevent private pages from being cached by the browser.
app.use((req, res, next) => {
    if (req.path.startsWith("/user/")) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
    }

    next();
});

// Parse form data submitted by HTML forms
app.use(express.urlencoded({ extended: true }));

// Parse JSON data from API requests
app.use(express.json());

// Support PUT and DELETE methods from HTML forms
app.use(methodOverride("_method"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);


// ==============================
// Passport
// ==============================

app.use(passport.initialize());


// ==============================
// Current User and Cart Count
// ==============================

app.use(async (req, res, next) => {
    try {
        res.locals.currentUser = null;
        res.locals.cartCount = 0;

        if (req.session.userId) {
            const user = await User
                .findById(req.session.userId)
                .select("name email profileImage")
                .lean();

            if (user) {
                res.locals.currentUser = user;

                const cart = await Cart
                    .findOne({ user: req.session.userId })
                    .select("items")
                    .lean();

                if (cart && Array.isArray(cart.items)) {
                    res.locals.cartCount = cart.items.reduce(
                        (total, item) => total + (item.quantity || 0),
                        0
                    );
                }
            }
        }

        next();
    } catch (error) {
        console.error(
            "Current user and cart count middleware error:",
            error
        );

        res.locals.currentUser = null;
        res.locals.cartCount = 0;

        next();
    }
});
// ==============================
// Static Files
// ==============================

app.use(express.static("public"));


// ==============================
// Database
// ==============================

connectDB();


// ==============================
// Routes
// ==============================

app.use("/auth", authRoutes);

app.use("/user", userRoutes);

// Customer-facing shop URL used by the Home page
app.get("/shop", (req, res) => {
    res.redirect(302, `/user/shop${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`);
});

app.use("/admin", adminRoutes);

// ==============================
// Home
// ==============================

app.get("/", (req, res) => {

    res.render("user/home");

});


// ==============================
// Start Server
// ==============================

app.listen(PORT, () => {

    console.log(
        `KidLoop server running on port ${PORT}`
    );

});