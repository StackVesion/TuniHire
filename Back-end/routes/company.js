const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken, isAdmin } = require("../middleware/auth");
const upload = require("../utils/fileUpload");

// Protected routes - User must be authenticated
router.get("/user/my-company", verifyToken, companyController.getMyCompany);

// Company creation endpoint with file upload
router.post("/", verifyToken, upload.single('logo'), companyController.createCompany);

// Public routes
router.get("/", companyController.getAllCompanies);

// Routes with parameters - these must come after specific routes
router.get("/:id", companyController.getCompanyById);
router.put("/:id", verifyToken, upload.single('logo'), companyController.updateCompany);
router.delete("/:id", verifyToken, companyController.deleteCompany);

// Admin only routes
router.get("/admin/analytics", verifyToken, isAdmin, companyController.getAnalytics);
router.get("/admin/pending", verifyToken, isAdmin, companyController.getPendingCompanies);
router.put("/approve/:id", verifyToken, isAdmin, (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization); // Log the Authorization header
  next();
}, companyController.approveCompany);
router.put("/reject/:id", verifyToken, isAdmin, companyController.rejectCompany);

// Routes with parameters - these must come after specific routes
router.get("/:id", companyController.getCompanyById);
router.put("/:id", verifyToken, companyController.updateCompany);
router.delete("/:id", verifyToken, companyController.deleteCompany);

module.exports = router;
