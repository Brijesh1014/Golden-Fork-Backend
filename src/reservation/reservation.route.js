const express = require("express");
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getAvailableSlots,
  deleteReservation,
  cancelReservation
} = require("./reservation.controller");
const auth = require("../middleware/auth.middleware");

router.post("/createReservation",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), createReservation);

router.get("/getAllReservations",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAllReservations);

router.get("/getAvailableSlots",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAvailableSlots);

router.delete("/deleteReservation/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), deleteReservation);

router.put("/cancelReservation/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),cancelReservation )

module.exports = router;
