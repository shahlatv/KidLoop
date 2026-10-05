const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");

// Load environment variables FIRST
dotenv.config();

const connectDB = require("./config/db");
const passport = require("./config/passport");

const User = require("./models/User");

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

app.use(express.json());

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
// Current User
// ==============================

app.use(async (req, res, next) => {

    try {

        res.locals.currentUser = null;

        if (req.session.userId) {

            const user =
                await User
                    .findById(req.session.userId)
                    .select("name email profileImage")
                    .lean();

            if (user) {
                res.locals.currentUser = user;
            }
        }

        next();

    } catch (error) {

        console.error(
            "Current user middleware error:",
            error
        );

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