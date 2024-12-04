const User_Model = require("../user/user.model");
const Reservation = require("../reservation/reservation.model")
const Order = require("../order/order.model")
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, name, isEmailVerified ,status} = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = {};
    if (role) {
      filter.role = { $regex: role, $options: "i" }; 
    }
    
    if (name) {
      const nameRegex = { $regex: name, $options: "i" }; 
      filter.$or = [
        { firstName: nameRegex },
        { lastName: nameRegex },
      ];
    }

    if (isEmailVerified !== undefined) {
      filter.isEmailVerified = isEmailVerified === 'true'; 
    }
    if (status) {
      console.log('status: ', status);
      console.log("edsfdes");
      
      filter.status  = { $regex: status, $options: "i" };
    }

    const totalUsersCount = await User_Model.countDocuments(filter);
    const users = await User_Model.find(filter).skip(skip).limit(pageSize);

    const totalPages = Math.ceil(totalUsersCount / pageSize);
    const remainingPages = totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    const totalCustomers = await User_Model.countDocuments({ role: "Customer" });
    const activeCustomers = await User_Model.countDocuments({ role: "Customer", status: "Activate" });
    const activeUsers = await User_Model.countDocuments({ status: "Activate" });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      users,
      meta: {
        totalUsersCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: users.length,
        totalCustomers,
        activeCustomers,
        activeUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};



const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User_Model.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User_Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User_Model.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const confirmTableReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status: "Confirmed" },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    res.status(200).json({
      message: "Reservation confirmed successfully.",
      reservation,
    });
  } catch (error) {
    console.error("Error confirming reservation:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const cancelTableReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status: "Cancelled" },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    res.status(200).json({
      message: "Reservation cancelled successfully by admin.",
      reservation,
    });
  } catch (error) {
    console.error("Error cancelling reservation by admin:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const searchOrders = async (req, res) => {
  try {
    const { query } = req.query;

    const orders = await Order.find({
      deleted: false,
      $or: [
        { "customerId.name": { $regex: query, $options: "i" } },
        { _id: query },
      ],
    })
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("items.itemId", "name price");

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getDailyRevenue = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalOrders: { $count: {} },
        },
      },
    ]);

    res.status(200).json({ success: true, data: revenue[0] || { totalRevenue: 0, totalOrders: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Confirmed", "Preparing", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order || order.deleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query; 
    const validStatuses = ["Pending", "Confirmed", "Preparing", "Completed", "Cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const orders = await Order.find({ status, deleted: false })
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("items.itemId", "name price");

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



module.exports = {
  getAllUsers,
  getById,
  updateById,
  deleteById, 
  confirmTableReservation,
  cancelTableReservation,
  getOrdersByStatus,
  updateOrderStatus,
  getDailyRevenue,
  searchOrders

};
