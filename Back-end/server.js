const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nodemailer = require('nodemailer');
require("dotenv").config();
const connectDB = require("./config/db");
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('./config/githubAuth');
const upload = require('./utils/fileUpload');

// Express app
const app = express();

// Update CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://tunihire-front-5oz083brc-fadi-zaghdouds-projects.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Add preflight OPTIONS handler
app.options('*', cors());

// Configure Helmet with relaxed CSP for PDF viewing
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files with CORS headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Special route for PDF files with proper headers for iframe embedding
app.get('/uploads/resumes/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'uploads', 'resumes', filename);
  
  // Set headers to allow iframe embedding
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Send the file
  res.sendFile(filePath);
});

// Connect to MongoDB
connectDB();

// Email transporters
const verificationEmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_APP_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  port: process.env.SMTP_PORT,
  tls: {
    rejectUnauthorized: false
  }
});

const otpEmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  port: process.env.SMTP_PORT,
  tls: {
    rejectUnauthorized: false
  }
});

global.verificationEmailTransporter = verificationEmailTransporter;
global.otpEmailTransporter = otpEmailTransporter;

// Test email configs
async function testEmailConfigs() {
  try {
    await verificationEmailTransporter.verify();
    console.log('Verification email server connection OK');
    
    await otpEmailTransporter.verify();
    console.log('OTP email server connection OK');
  } catch (error) {
    console.error('Email server connection failed:', error);
  }
}

testEmailConfigs();
    
// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);

// Passport config
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (!user) {
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profilePicture: profile.photos[0].value,
        role: 'CANDIDATE', // default role
        isVerified: true // verified by Google
      });
      await user.save();
    } else if (!user.googleId) {
      // If user exists by email but doesn't have googleId
      user.googleId = profile.id;
      await user.save();
    }
    return done(null, user);
  } catch (error) {
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
app.use("/api/auth", require("./routes/user"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/companies", require("./routes/company"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/portfolios", require("./routes/portfolioRoutes"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/health", require("./routes/health"));

// API route list
app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if(middleware.route) {
            // Routes registered directly on the app
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if(middleware.name === 'router') {
            // Router middleware
            middleware.handle.stack.forEach(handler => {
                if(handler.route) {
                    routes.push({
                        path: middleware.regexp.toString() + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

// Google auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/page-signin' }),
  async function(req, res) {
    try {
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || "your-jwt-secret",
        { expiresIn: '1h' }
      );

      const userData = {
        userId: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        googleId: req.user.googleId
      };

      const userDataParam = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`http://localhost:3000/?token=${token}&userData=${userDataParam}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect('http://localhost:3000/page-signin?error=Authentication failed');
    }
  });

// GitHub auth
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
      
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        process.env.JWT_SECRET || "your-jwt-secret",
        { expiresIn: '1h' }
      );
      
      const userData = {
        userId: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        githubId: req.user.githubId
      };
      
      const userDataParam = encodeURIComponent(JSON.stringify(userData));
      res.redirect(`http://localhost:3000/?token=${token}&userData=${userDataParam}`);
    } catch (error) {
      console.error("Error in GitHub callback:", error);
      res.redirect('http://localhost:3000/page-signin?error=Authentication failed');
    }
  },
  function(err, req, res, next) {
    console.error("GitHub auth error:", err);
    res.redirect(`http://localhost:3000/page-signin?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
);

// Logout routes
app.get('/api/users/google/logout', (req, res) => {
  req.logout(function(err) {
    if (err) console.error("Error during passport logout:", err);
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
      res.clearCookie('connect.sid', { path: '/' });
      res.status(200).json({ message: "Successfully logged out from Google" });
    });
  });
});

app.get('/api/users/github/logout', (req, res) => {
  req.logout(function(err) {
    if (err) console.error("Error during passport logout:", err);
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
      res.clearCookie('connect.sid', { path: '/' });
      res.status(200).json({ message: "Successfully logged out from GitHub" });
    });
  });
});

app.get('/auth/logout', (req, res) => {
  req.logout(function(err) {
    if (err) console.error("Error during passport logout:", err);
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('http://localhost:3000/page-signin');
    });
  });
});
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB Connected: ${mongoose.connection.host}`);
});
