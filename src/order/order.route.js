const express = require("express");
const router = express.Router();
const orderController = require("./order.controller");
const auth = require("../middleware/auth.middleware");

router.post(
  "/createOrder",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.createOrder
);

router.get(
  "/getOrders",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.getOrders
);

router.get(
  "/getOrderById/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.getOrderById
);

router.put(
  "/cancelOrderStatus/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.cancelOrderStatus
);

router.delete(
  "/deleteOrder/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.deleteOrder
);

router.put(
  "/updateOrderDetails/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.updateOrderDetails
);

router.put(
  "/addItemToOrder/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.addItemToOrder
);

router.put(
  "/removeItemFromOrder/:id",
  auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
  orderController.removeItemFromOrder
);

router.post(
    "/addQuantityToItem/:id",
    auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
    orderController.addQuantityToItem
  );
  
  router.post(
    "/removeQuantityFromItem/:id",
    auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
    orderController.removeQuantityFromItem
  );

  router.get(
    "/getUserOrders",
    auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),
    orderController.getUserOrders
  );

module.exports = router;
