const User_Model = require("../user/user.model");
const Reservation = require("../reservation/reservation.model");
const Order = require("../order/order.model");
const bcrypt = require("bcrypt");
const shareCredential = require("../services/shareCredential.service");
const Table = require("../table/table.model");
const restaurant = require("../restaurant/restaurant.model");
const kitchenModel = require("../kitchen/kitchen.model");
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      name,
      isEmailVerified,
      status,
    } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = {};
    if (role) {
      filter.role = { $regex: role, $options: "i" };
    }

    if (name) {
      const nameRegex = { $regex: name, $options: "i" };

      const nameParts = name.split(" ");

      const conditions = [];
      if (nameParts.length > 1) {
        conditions.push(
          {
            firstName: { $regex: nameParts[0], $options: "i" },
            lastName: { $regex: nameParts[1], $options: "i" },
          },
          {
            firstName: { $regex: nameParts[1], $options: "i" },
            lastName: { $regex: nameParts[0], $options: "i" },
          }
        );
      }

      conditions.push({ firstName: nameRegex }, { lastName: nameRegex });

      filter.$or = conditions;
    }

    if (isEmailVerified !== undefined) {
      filter.isEmailVerified = isEmailVerified === "true";
    }
    if (status) {
      filter.status = { $regex: status, $options: "i" };
    }

    const totalUsersCount = await User_Model.countDocuments(filter);
    const users = await User_Model.find(filter).skip(skip).limit(pageSize);

    const totalPages = Math.ceil(totalUsersCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    const totalCustomers = await User_Model.countDocuments({
      role: "Customer",
    });
    const activeCustomers = await User_Model.countDocuments({
      role: "Customer",
      status: "Activate",
    });
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
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
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

    const updatedUser = await User_Model.findByIdAndUpdate(id, updateData, {
      new: true,
    });

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

    const user = await User_Model.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    await restaurant.deleteMany({ restaurantAdminId: id });
    await kitchenModel.deleteMany({ kitchenAdminId: id });
    await User_Model.findByIdAndDelete(id);

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
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
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

    res.status(200).json({
      success: true,
      data: revenue[0] || { totalRevenue: 0, totalOrders: 0 },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Completed",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
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
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const validStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Completed",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const orders = await Order.find({ status, deleted: false })
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("items.itemId", "name price");

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const generateRandomPassword = (length = 12) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
};

const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      username,
      gender,
      profileImage,
      country,
      state,
      city,
      zipCode,
      deliveryAddress,
      role,
      restaurant,
      kitchen,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    const userId = req.userId;

    const existingUser = await User_Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const generatedPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newUser = await User_Model.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      username,
      password: hashedPassword,
      gender,
      profileImage,
      country,
      state,
      city,
      zipCode,
      deliveryAddress,
      role,
      restaurant,
      kitchen,
      createdBy: userId,
      isEmailVerified: true,
    });

    let name = `${firstName} ${lastName}`;

    if (newUser) {
      await shareCredential(
        name,
        email,
        generatedPassword,
        email,
        "Your Account Credentials",
        "../views/shareCredential.ejs"
      );
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: newUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the user.",
    });
  }
};

const getAvailableTableAndSlotsForAllRestaurants = async (req, res) => {
  try {
    const { reservationDate, tableId } = req.query;

    if (!reservationDate) {
      return res.status(400).json({ error: "reservationDate is required." });
    }

    const date = new Date(reservationDate);
    const startBusinessHour = "08:00";
    const endBusinessHour = "22:00";

    const generateTimeSlots = (start, end) => {
      const slots = [];
      let current = start;
      while (current < end) {
        const next = new Date(current.getTime() + 90 * 60000);
        if (next <= end) {
          slots.push({ start: current, end: next });
        }
        current = new Date(current.getTime() + 15 * 60000);
      }
      return slots;
    };

    const slots = generateTimeSlots(
      new Date(`${reservationDate}T${startBusinessHour}`),
      new Date(`${reservationDate}T${endBusinessHour}`)
    );

    // Query for all restaurants
    const restaurants = await restaurant.find();

    if (!restaurants.length) {
      return res
        .status(404)
        .json({ success: false, message: "No restaurants found." });
    }

    const availableSlotsForAllRestaurants = [];

    for (const restaurant of restaurants) {
      const query = {
        restaurantId: restaurant._id,
        reservationDate: date,
        status: { $in: ["Pending", "Confirmed"] },
      };
      if (tableId) {
        query.tableId = tableId;
      }

      const reservations = await Reservation.find(query);
      const tables = await Table.find({ restaurantId: restaurant._id });

      const availableSlotsForTables = [];

      for (const table of tables) {
        const unavailableSlotsFromAvailability = table.availability.filter(
          (slot) =>
            new Date(slot.date).toISOString().slice(0, 10) ===
              date.toISOString().slice(0, 10) && !slot.isAvailable
        );

        const unavailableSlots = [
          ...unavailableSlotsFromAvailability,
          ...reservations
            .filter((res) => res.tableId.includes(table._id))
            .map((res) => ({
              start: new Date(`${reservationDate}T${res.startTime}`),
              end: new Date(`${reservationDate}T${res.endTime}`),
            })),
        ];

        const availableSlots = slots.filter((slot) => {
          return !unavailableSlots.some(
            (unSlot) => slot.start < unSlot.end && slot.end > unSlot.start
          );
        });

        if (availableSlots.length > 0) {
          availableSlotsForTables.push({
            tableId: table._id,
            tableNumber: table.tableNumber,
            tableCapacity: table.capacity,
            availableSlots: availableSlots.map((slot) => ({
              startTime: slot.start.toTimeString().slice(0, 5),
              endTime: slot.end.toTimeString().slice(0, 5),
            })),
          });
        }
      }

      if (availableSlotsForTables.length > 0) {
        availableSlotsForAllRestaurants.push({
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          availableSlotsForTables,
        });
      }
    }

    const totalAvailableTableCount = availableSlotsForAllRestaurants.reduce(
      (total, restaurant) => {
        return total + restaurant.availableSlotsForTables.length;
      },
      0
    );

    if (totalAvailableTableCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No available slots for the given date across any restaurant.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Available slots for all restaurants fetched successfully.",
      totalAvailableTableCount,
      availableSlots: availableSlotsForAllRestaurants,
    });
  } catch (error) {
    console.error("Error fetching available slots for all restaurants:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAvailableTableAndSlots = async (req, res) => {
  try {
    const { restaurantId, reservationDate, tableId } = req.query;

    if (!restaurantId || !reservationDate) {
      return res
        .status(400)
        .json({ error: "restaurantId and reservationDate are required." });
    }

    const date = new Date(reservationDate);
    const startBusinessHour = "08:00";
    const endBusinessHour = "22:00";

    const generateTimeSlots = (start, end) => {
      const slots = [];
      let current = start;
      while (current < end) {
        const next = new Date(current.getTime() + 90 * 60000);
        if (next <= end) {
          slots.push({ start: current, end: next });
        }
        current = new Date(current.getTime() + 15 * 60000);
      }
      return slots;
    };

    const slots = generateTimeSlots(
      new Date(`${reservationDate}T${startBusinessHour}`),
      new Date(`${reservationDate}T${endBusinessHour}`)
    );

    const query = {
      restaurantId,
      reservationDate: date,
      status: { $in: ["Pending", "Confirmed"] },
    };
    if (tableId) {
      query.tableId = tableId;
    }

    const reservations = await Reservation.find(query);

    const tables = await Table.find({ restaurantId });

    const availableSlotsForTables = [];

    for (const table of tables) {
      const unavailableSlotsFromAvailability = table.availability.filter(
        (slot) =>
          new Date(slot.date).toISOString().slice(0, 10) ===
            date.toISOString().slice(0, 10) && !slot.isAvailable
      );

      const unavailableSlots = [
        ...unavailableSlotsFromAvailability,
        ...reservations
          .filter((res) => res.tableId.includes(table._id))
          .map((res) => ({
            start: new Date(`${reservationDate}T${res.startTime}`),
            end: new Date(`${reservationDate}T${res.endTime}`),
          })),
      ];

      const availableSlots = slots.filter((slot) => {
        return !unavailableSlots.some(
          (unSlot) => slot.start < unSlot.end && slot.end > unSlot.start
        );
      });

      if (availableSlots.length > 0) {
        availableSlotsForTables.push({
          tableId: table._id,
          tableNumber: table.tableNumber,
          tableCapacity: table.capacity,
          availableSlots: availableSlots.map((slot) => ({
            startTime: slot.start.toTimeString().slice(0, 5),
            endTime: slot.end.toTimeString().slice(0, 5),
          })),
        });
      }
    }

    const totalAvailableTableCount = availableSlotsForTables.length;

    if (totalAvailableTableCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No available slots for the given date.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Available slots fetched successfully.",
      totalAvailableTableCount,
      availableSlots: availableSlotsForTables,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
const availableRestaurantAdmin = async (req, res) => {
  try {
    const users = await User_Model.find({
      role: "RestaurantAdmin",
      restaurant: null,
    });

    res.status(200).json({
      success: true,
      data: users,
      message: "Available restaurant admins fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching available restaurant admins:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching available restaurant admins.",
    });
  }
};

const availableKitchenAdmin = async (req, res) => {
  try {
    const users = await User_Model.find({
      role: "KitchenAdmin",
      kitchen: null,
    });

    res.status(200).json({
      success: true,
      data: users,
      message: "Available kitchen admins fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching available kitchen admins:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching available kitchen admins.",
    });
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
  searchOrders,
  createUser,
  getAvailableTableAndSlotsForAllRestaurants,
  getAvailableTableAndSlots,
  availableRestaurantAdmin,
  availableKitchenAdmin,
};
