const express = require("express");
const authController = require("../auth/auth.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/register", authController.register);
router.post("/verifyEmail", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/forgetPassword", authController.forgetPassword);
router.post("/verifyOtp", authController.verifyOtp);
router.put("/resetPassword", authController.resetPassword);
router.post("/resendOtp", authController.resendOtp);
router.post(
  "/changePassword",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  authController.changePassword
);
router.post(
  "/logout",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  authController.logout
);

module.exports = router;
