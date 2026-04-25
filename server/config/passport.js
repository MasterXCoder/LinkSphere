const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { getDB } = require("../database/db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const db = getDB();
        const users = db.collection("users");

        // Check if user already exists by googleId
        let user = await users.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if a user with the same email already exists (manual signup)
        const email = profile.emails?.[0]?.value;
        const existingEmailUser = await users.findOne({ email });

        if (existingEmailUser) {
          // Link Google account to existing user
          await users.updateOne(
            { email },
            { $set: { googleId: profile.id } }
          );
          const updatedUser = await users.findOne({ email });
          return done(null, updatedUser);
        }

        // Create a new user from Google profile
        const newUser = {
          id: Date.now(),
          username: profile.displayName || profile.name?.givenName || "User",
          email: email,
          dob: null,
          password: null, // No password for OAuth users
          googleId: profile.id,
        };

        await users.insertOne(newUser);
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
    const db = getDB();
    const user = await db.collection("users").findOne({ id });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
