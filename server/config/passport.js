const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if a user with the same email already exists (manual signup)
        const email = profile.emails?.[0]?.value;
        const existingEmailUser = await User.findOne({ email });

        if (existingEmailUser) {
          // Link Google account to existing user (also sync Google photo if they have no avatar)
          existingEmailUser.googleId = profile.id;
          const googlePhoto = profile.photos?.[0]?.value || null;
          if (googlePhoto && !existingEmailUser.avatarUrl) {
            existingEmailUser.avatarUrl = googlePhoto;
          }
          await existingEmailUser.save();
          return done(null, existingEmailUser);
        }

        // Create a new user from Google profile
        const googlePhoto = profile.photos?.[0]?.value || null;
        const newUser = new User({
          username: profile.displayName || profile.name?.givenName || "User",
          email: email,
          googleId: profile.id,
          avatarUrl: googlePhoto,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize user ID into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ id });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
