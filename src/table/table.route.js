const express = require("express");
const router = express.Router();
const {
  createTable,
  getAllTables,
  updateTable,
  deleteTable,
  getTableById,
} = require("./table.controller");
const auth = require('../middleware/auth.middleware');

router.post("/createTable",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), createTable);              
router.get("/getAllTables",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getAllTables);           
router.get("/getTableById/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), getTableById);        
router.put("/updateTable/:id", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),updateTable);           
router.delete("/deleteTable/:id", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),deleteTable);        

module.exports = router;
