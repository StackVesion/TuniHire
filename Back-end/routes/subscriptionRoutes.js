const express = require("express");
const router = express.Router();
const subscriptionPlanController = require("../controllers/subscriptionPlanController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Public routes - Get all available subscription plans
router.get("/plans", subscriptionPlanController.getAllSubscriptionPlans);
router.get("/plans/:id", subscriptionPlanController.getSubscriptionPlanById);

// User subscription routes
router.get("/user-subscription", verifyToken, subscriptionPlanController.getUserSubscription);
router.post("/subscribe/:planId", verifyToken, subscriptionPlanController.subscribeUser);
router.post("/payment-intent", verifyToken, subscriptionPlanController.createPaymentIntent);
router.post("/confirm-payment", verifyToken, subscriptionPlanController.confirmPayment);

// Payment transaction routes
router.get("/transactions", verifyToken, isAdmin, subscriptionPlanController.getAllTransactions);
router.get("/transactions/:id", verifyToken, isAdmin, subscriptionPlanController.getTransactionById);
router.get("/user-transactions", verifyToken, subscriptionPlanController.getUserTransactions);

// Admin only routes - Manage subscription plans
router.post("/plans", verifyToken, isAdmin, subscriptionPlanController.createSubscriptionPlan);
router.put("/plans/:id", verifyToken, isAdmin, subscriptionPlanController.updateSubscriptionPlan);
router.delete("/plans/:id", verifyToken, isAdmin, subscriptionPlanController.deleteSubscriptionPlan);

// Add debug endpoints
router.get("/debug", (req, res) => {
  res.status(200).json({ message: "Subscription routes are working!" });
});

router.get("/debug/auth", verifyToken, (req, res) => {
  res.status(200).json({ 
    message: "Auth middleware is working!", 
    user: req.user 
  });
});

console.log("Subscription routes loaded");

module.exports = router;
