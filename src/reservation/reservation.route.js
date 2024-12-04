const express = require("express");
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getAvailableTableAndSlots,
  deleteReservation,
  cancelReservation,
  getAvailableTable,
  getUserReservations,
  getAvailableSlots
} = require("./reservation.controller");
const auth = require("../middleware/auth.middleware");

router.post("/createReservation",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), createReservation);

router.get("/getAllReservations",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAllReservations);

router.get("/getAvailableTableAndSlots",auth([ "RestaurantAdmin", "SuperAdmin"]), getAvailableTableAndSlots);

router.delete("/deleteReservation/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), deleteReservation);

router.put("/cancelReservation/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),cancelReservation )

router.get("/getAvailableTable",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAvailableTable);

router.get("/getAvailableSlots",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAvailableSlots);

router.get("/getUserReservations",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getUserReservations);

module.exports = router;
