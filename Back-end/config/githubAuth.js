const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// Log GitHub strategy configuration for debugging
console.log("GitHub Strategy Configuration:");
console.log("Client ID present:", !!process.env.GITHUB_CLIENT_ID);
console.log("Client Secret present:", !!process.env.GITHUB_CLIENT_SECRET);
console.log("Callback URL:", process.env.GITHUB_CALLBACK_URL || "/auth/github/callback");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GitHub auth callback received profile:", JSON.stringify(profile, null, 2));
        
        // First, try to find user by githubId
        let user = await User.findOne({ githubId: profile.id });
        
        // If not found by githubId, try to find by email if available
        if (!user && profile.emails && profile.emails[0]) {
          console.log("User not found by githubId, trying email:", profile.emails[0].value);
          user = await User.findOne({ email: profile.emails[0].value });
        }
        
        if (!user) {
          // Create new user if doesn't exist
          console.log("Creating new user from GitHub profile");
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
          const firstName = profile.displayName ? profile.displayName.split(" ")[0] : profile.username;
          const lastName = profile.displayName && profile.displayName.split(" ").length > 1 
            ? profile.displayName.split(" ").slice(1).join(" ") 
            : "";
          
          user = new User({
            githubId: profile.id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
            role: "candidate" // Default role
          });
          
          await user.save();
          console.log("New user created via GitHub Auth:", email);
        } else if (!user.githubId) {
          // If user exists but doesn't have githubId, update the githubId
          console.log("Linking existing user with GitHub ID:", user.email);
          user.githubId = profile.id;
          await user.save();
          console.log("Existing user updated with GitHub ID:", user.email);
        } else {
          console.log("Existing GitHub user found:", user.email);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("GitHub auth error:", error);
        return done(error, null);
      }
    }
  )
);

// Ensure serialization is properly set up
if (!passport._serializers || passport._serializers.length === 0) {
  console.log("Setting up passport serializers for GitHub auth");
  
  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user._id);
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log("Deserializing user:", id);
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      console.error("Deserialize error:", error);
      done(error, null);
    }
  });
}

module.exports = { GitHubStrategy };
