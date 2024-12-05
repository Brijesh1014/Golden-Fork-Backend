const express = require("express");
const router = express.Router();
const contactUsController = require("./contactUs.controller");
const auth = require("../middleware/auth.middleware");

router.post(
  "/create",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  contactUsController.createContactUs
);
router.get(
  "/getAllContactUs",
  auth(["SuperAdmin"]),
  contactUsController.getAllContactUs
);
router.get(
  "/getContactUsById/:id",
  auth(["SuperAdmin"]),
  contactUsController.getContactUsById
);
router.delete(
  "/deleteContactUs/:id",
  auth(["SuperAdmin"]),
  contactUsController.deleteContactUs
);
router.post("/sendReply", auth(["SuperAdmin"]), contactUsController.sendReply);
router.get(
  "/getInquiriesWithoutSendReply",
  auth(["SuperAdmin"]),
  contactUsController.getInquiriesWithoutReply
);
router.get(
  "/getSentReplyById/:id",
  auth(["SuperAdmin"]),
  contactUsController.getSentReplyById
);
router.get(
  "/getAllSentReplies",
  auth(["SuperAdmin"]),
  contactUsController.getAllSentReplies
);
module.exports = router;
