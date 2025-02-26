const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require("dotenv").config(); // Load environment variables
const connectDB = require("./config/db");
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('./config/githubAuth'); // Add this line to require GitHub auth config

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Session configuration - must come after CORS and cookieParser
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only use secure in production
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists by googleId or email
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName || '',
        lastName: profile.name.familyName || '',
        profilePicture: profile.photos[0]?.value || '',
        role: "candidate" // Default role
      });
      await user.save();
      console.log("New user created via Google Auth:", user.email);
    } else if (!user.googleId) {
      // If user exists by email but doesn't have googleId, update the googleId
      user.googleId = profile.id;
      
      // Update user profile data if missing
      if (!user.firstName) user.firstName = profile.name.givenName || '';
      if (!user.lastName) user.lastName = profile.name.familyName || '';
      if (!user.profilePicture) user.profilePicture = profile.photos[0]?.value || '';
      
      await user.save();
      console.log("Existing user updated with Google ID:", user.email);
    }
    
    return done(null, user);
  } catch (error) {
    console.error("Google auth error:", error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", require("./routes/userRoutes"));

// Google auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/page-signin' }),
  async function(req, res) {
    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || "your-jwt-secret",
        { expiresIn: '1h' }
      );
      
      // Prepare user data for frontend
      const userData = {
        userId: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        googleId: req.user.googleId // Include googleId to identify Google-authenticated users
      };
      
      // Redirect to frontend with token and user data as query params
      const userDataParam = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`http://localhost:3000/?token=${token}&userData=${userDataParam}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect('http://localhost:3000/page-signin?error=Authentication failed');
    }
  });

// GitHub auth routes
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', 
  function(req, res, next) {
    console.log("GitHub callback received, authenticating with passport");
    passport.authenticate('github', { 
      failureRedirect: 'http://localhost:3000/page-signin?error=github_auth_failed',
      failWithError: true 
    })(req, res, next);
  },
  async function(req, res) {
    try {
      console.log("GitHub authentication successful, generating token for user:", req.user.email);
      
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || "your-jwt-secret",
        { expiresIn: '1h' }
      );
      
      // Prepare user data for frontend
      const userData = {
        userId: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        githubId: req.user.githubId // Include githubId to identify GitHub-authenticated users
      };
      
      console.log("Redirecting to frontend with user data");
      
      // Redirect to frontend with token and user data as query params
      const userDataParam = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`http://localhost:3000/?token=${token}&userData=${userDataParam}`);
    } catch (error) {
      console.error("Error in GitHub callback:", error);
      res.redirect('http://localhost:3000/page-signin?error=Authentication failed');
    }
  },
  function(err, req, res, next) {
    console.error("GitHub auth error:", err);
    res.redirect('http://localhost:3000/page-signin?error=' + encodeURIComponent(err.message || 'Authentication failed'));
  }
);

// Dedicated Google logout route
app.get('/api/users/google/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error("Error during passport logout:", err); 
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.status(200).json({ message: "Successfully logged out from Google" });
    });
  });
});

// Dedicated GitHub logout route
app.get('/api/users/github/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error("Error during passport logout:", err); 
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.status(200).json({ message: "Successfully logged out from GitHub" });
    });
  });
});

// General logout route - kept for backward compatibility
app.get('/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error("Error during passport logout:", err); 
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('http://localhost:3000/page-signin');
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});