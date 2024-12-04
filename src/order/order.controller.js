const Order = require("./order.model");

const createOrder = async (req, res) => {
  try {
    const { restaurantId, customerId, items, totalAmount, shippingAddress, paymentMethod, paymentStatus, orderType, reservationId } = req.body;

    if (!restaurantId || !customerId || !items || items.length === 0 || !totalAmount || !orderType) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (orderType === "Dine-in" && !reservationId) {
      return res.status(400).json({ success: false, message: "Reservation ID is required for Dine-in orders" });
    }

    const orderData = {
      restaurantId,
      customerId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      orderType,
    };

    if (orderType === "Dine-in") {
      orderData.reservationId = reservationId;
    }

    const order = new Order(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ deleted: { $ne: true } })
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("items.itemId", "name price")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalOrders = await Order.countDocuments({ deleted: { $ne: true } });

    const meta = {
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: Number(page),
      limit: Number(limit),
    };

    res.status(200).json({
      success: true,
      data: orders,
      meta,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("items.itemId", "name price");

    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const cancelOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancel successfully",
      data: order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, totalAmount } = req.body;

    if (!items && totalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide items or totalAmount to update",
      });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items must be a non-empty array",
        });
      }
      order.items = items;
    }

    if (totalAmount !== undefined) {
      if (totalAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Total amount cannot be negative",
        });
      }
      order.totalAmount = totalAmount;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order details updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const addItemToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity } = req.body;
    let userId = req.userId;
    if (!itemId || !quantity || !userId) {
      return res.status(400).json({
        success: false,
        message: "Item ID, quantity, and user ID are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const existingItemIndex = order.items.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (existingItemIndex > -1) {
      order.items[existingItemIndex].quantity += quantity;
    } else {
      order.items.push({ itemId, quantity });
    }

    const updatedTotal = order.items.reduce((total, item) => {
      return total + item.quantity * 10;
    }, 0);

    // order.totalAmount = updatedTotal;
    order.lastModifiedBy = userId;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Item added to order successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const removeItemFromOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.items.findIndex(
      (item) => item.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in the order",
      });
    }

    // const removedItem = order.items[itemIndex];
    // order.totalAmount -= removedItem.quantity * removedItem.price;

    order.items.splice(itemIndex, 1);
    await order.save();

    res.status(200).json({
      success: true,
      message: "Item removed from order successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

addQuantityToItem = async (req, res) => {
  try {
    const { id } = req.params; 
    const { itemId, quantity } = req.body; 

    const userId = req.userId

    if (!itemId || !quantity || !userId) {
      return res.status(400).json({
        success: false,
        message: "Item ID, quantity, and user ID are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.items.findIndex(
      (item) => item.itemId.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in the order",
      });
    }

    const updateField = `items.${itemIndex}.quantity`;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $inc: { [updateField]: quantity }, 
        $set: { lastModifiedBy: userId }, 
      },
      { new: true } 
    );


    // updatedOrder.totalAmount = updatedOrder.items.reduce((total, item) => {
    //   return total + item.quantity * 10; // Assume a placeholder price of 10 per item
    // }, 0);

    await updatedOrder.save();

    res.status(200).json({
      success: true,
      message: "Item quantity increased successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const removeQuantityFromItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId
    const { itemId, quantity } = req.body; 

    if (!itemId || !quantity || !userId) {
      return res.status(400).json({
        success: false,
        message: "Item ID, quantity, and user ID are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.items.findIndex(
      (item) => item.itemId.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in the order",
      });
    }

    const item = order.items[itemIndex];
    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove more than the existing quantity",
      });
    }

    const updateField = `items.${itemIndex}.quantity`;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $inc: { [updateField]: -quantity },
        $set: { lastModifiedBy: userId },
      },
      { new: true } 
    );

    if (updatedOrder.items[itemIndex].quantity === 0) {
      updatedOrder.items = updatedOrder.items.filter(
        (i) => i.itemId.toString() !== itemId
      );
    }

    // // Recalculate totalAmount
    // updatedOrder.totalAmount = updatedOrder.items.reduce((total, item) => {
    //   return total + item.quantity * 10; // Placeholder price logic
    // }, 0);

    await updatedOrder.save();

    res.status(200).json({
      success: true,
      message: "Item quantity decreased successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};




const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order || order.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.deleted = true;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const  userId  = req.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const orders = await Order.find({ customerId: userId })
      .populate("restaurantId", "name address")  
      .populate("items.itemId", "name price")   
      .populate("reservationId", "reservationDate startTime endTime status") 
      .sort({ createdAt: -1 }); 

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found for this user" });
    }

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderDetails,
  cancelOrderStatus,
  deleteOrder,
  addItemToOrder,
  removeItemFromOrder,
  addQuantityToItem,
  removeQuantityFromItem,
  getUserOrders
};
