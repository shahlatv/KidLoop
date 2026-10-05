const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback"
        },

        async (accessToken, refreshToken, profile, done) => {

            try {

                const email =
                    profile.emails &&
                    profile.emails[0]
                        ? profile.emails[0].value
                        : null;

                if (!email) {
                    return done(
                        new Error(
                            "Google account email not available"
                        ),
                        null
                    );
                }

                let user = await User.findOne({
                    email: email.toLowerCase()
                });

                /*
                 * Existing user
                 */

                if (user) {

                    user.googleId = profile.id;

                    user.authProvider = "google";

                    if (
                        !user.profileImage &&
                        profile.photos &&
                        profile.photos[0]
                    ) {
                        user.profileImage =
                            profile.photos[0].value;
                    }

                    await user.save();

                    return done(null, user);
                }


                /*
                 * New Google user
                 */

                user = await User.create({
                    name:
                        profile.displayName ||
                        "Google User",

                    email:
                        email.toLowerCase(),

                    profileImage:
                        profile.photos &&
                        profile.photos[0]
                            ? profile.photos[0].value
                            : "",

                    googleId: profile.id,

                    authProvider: "google",

                    isVerified: true
                });

                return done(null, user);

            } catch (error) {

                console.error(
                    "Google authentication error:",
                    error
                );

                return done(error, null);
            }
        }
    )
);


/*
 * Store user ID in session
 */

passport.serializeUser(
    (user, done) => {

        done(null, user._id);

    }
);


/*
 * Get user from session
 */

passport.deserializeUser(
    async (id, done) => {

        try {

            const user =
                await User.findById(id);

            done(null, user);

        } catch (error) {

            done(error, null);

        }

    }
);


module.exports = passport;