const Restaurant = require("../restaurant/restaurant.model");
const Table = require("../table/table.model");
const Reservation = require("./reservation.model");

const isSlotAvailable = (
  availability,
  requestedStartTime,
  requestedEndTime
) => {
  const requestedStart = new Date(`1970-01-01T${requestedStartTime}:00`);
  const requestedEnd = new Date(`1970-01-01T${requestedEndTime}:00`);

  const isAvailable = availability.every((slot) => {
    const reservedStart = new Date(`1970-01-01T${slot.startTime}:00`);
    const reservedEnd = new Date(`1970-01-01T${slot.endTime}:00`);

    return reservedEnd <= requestedStart || reservedStart >= requestedEnd; 
  });

  console.log("Requested Time:", { requestedStartTime, requestedEndTime });
  console.log("Availability Slots:", availability);
  console.log("Is Slot Available:", isAvailable);

  return isAvailable;
};

const calculateEndTime = (startTime, durationMinutes = 90) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toTimeString().slice(0, 5); // Format as HH:mm
};

const createReservation = async (req, res) => {
  try {
    const { restaurantId, customerId, reservationDate, startTime, capacity } =
      req.body;

    if (
      !restaurantId ||
      !customerId ||
      !reservationDate ||
      !startTime ||
      !capacity
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    const userId = req.userId;
    const endTime = calculateEndTime(startTime);

    const exactCapacityTables = await Table.find({
      restaurantId,
      capacity: { $eq: capacity },
    }).sort({ capacity: -1 });

    const largerCapacityTables = await Table.find({
      restaurantId,
      capacity: { $gt: capacity },
    }).sort({ capacity: -1 });

    let selectedTables = [];
    let totalCapacity = 0;

    for (const table of exactCapacityTables) {
      if (totalCapacity >= capacity) break;

      const availability = table.availability.filter(
        (slot) =>
          new Date(slot.date).toISOString().slice(0, 10) ===
          new Date(reservationDate).toISOString().slice(0, 10)
      );

      if (isSlotAvailable(availability, startTime, endTime)) {
        selectedTables.push(table._id);
        totalCapacity += table.capacity;
      }
    }

    if (totalCapacity < capacity) {
      for (const table of largerCapacityTables) {
        if (totalCapacity >= capacity) break;

        const availability = table.availability.filter(
          (slot) =>
            new Date(slot.date).toISOString().slice(0, 10) ===
            new Date(reservationDate).toISOString().slice(0, 10)
        );

        if (isSlotAvailable(availability, startTime, endTime)) {
          selectedTables.push(table._id);
          totalCapacity += table.capacity;
        }
      }
    }

    if (totalCapacity < capacity) {
      return res
        .status(400)
        .json({ success: false, message: "No suitable tables available." });
    }

    const reservation = new Reservation({
      restaurantId,
      customerId,
      tableId: selectedTables,
      reservationDate: new Date(reservationDate),
      startTime,
      endTime,
      createdBy: userId,
      status: "Confirmed",
    });

    await reservation.save();

    await Promise.all(
      selectedTables.map(async (tableId) => {
        await Table.findByIdAndUpdate(tableId, {
          $push: {
            availability: {
              isAvailable: false,
              date: new Date(reservationDate),
              startTime,
              endTime,
            },
          },
        });
      })
    );

    res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      data: reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reservations = await Reservation.find()
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("tableId", "number capacity")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalReservations = await Reservation.countDocuments();

    res.status(200).json({
      success: true,
      totalReservations,
      totalPages: Math.ceil(totalReservations / limit),
      currentPage: page,
      reservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    res.status(200).json({ message: "Reservation deleted successfully." });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const cancelReservation = async (req, res) => {
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
          availableSlots: availableSlots.map((slot) => ({
            startTime: slot.start.toTimeString().slice(0, 5),
            endTime: slot.end.toTimeString().slice(0, 5),
          })),
        });
      }
    }

    if (availableSlotsForTables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No available slots for the given date.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Available slots fetched successfully.",
      availableSlots: availableSlotsForTables,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAvailableTable = async (req, res) => {
  try {
    const { restaurantId, capacity, page = 1, limit = 10 } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: "restaurantId is required." });
    }

    const query = {
      isAvailable: true,
      restaurantId,
    };

    if (capacity) {
      query.capacity = { $gte: capacity };
    }

    const tables = await Table.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalTables = await Table.countDocuments(query);

    res.status(200).json({
      success: true,
      totalTables,
      totalPages: Math.ceil(totalTables / limit),
      currentPage: Number(page),
      tables,
    });
  } catch (error) {
    console.error("Error fetching available tables:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { restaurantId, reservationDate, capacity, tableId } = req.query;

    if (!restaurantId || !reservationDate) {
      return res
        .status(400)
        .json({ error: "restaurantId and reservationDate are required." });
    }

    const date = new Date(reservationDate);

    const startBusinessHour = "08:00";
    const endBusinessHour = "22:00";
    const slotIntervalMinutes = 15;
    const slotDurationMinutes = 90;

    const generateTimeSlots = (start, end) => {
      const slots = [];
      let current = new Date(start);
      const endBoundary = new Date(end);

      while (current < endBoundary) {
        const slotEnd = new Date(
          current.getTime() + slotDurationMinutes * 60000
        );
        if (slotEnd <= endBoundary) {
          slots.push({ start: new Date(current), end: slotEnd });
        }
        current = new Date(current.getTime() + slotIntervalMinutes * 60000);
      }
      return slots;
    };

    const availableSlots = generateTimeSlots(
      new Date(`${reservationDate}T${startBusinessHour}:00`),
      new Date(`${reservationDate}T${endBusinessHour}:00`)
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

    let allAvailableSlots = [];

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

      const availableSlotsForTable = availableSlots.filter((slot) => {
        return !unavailableSlots.some((unSlot) => {
          return (
            (slot.start >= unSlot.start && slot.start < unSlot.end) ||
            (slot.end > unSlot.start && slot.end <= unSlot.end) ||
            (slot.start <= unSlot.start && slot.end >= unSlot.end)
          );
        });
      });

      if (capacity && table.capacity < capacity) {
        continue;
      }

      allAvailableSlots.push(...availableSlotsForTable);
    }

    allAvailableSlots = allAvailableSlots.filter(
      (slot, index, self) =>
        index ===
        self.findIndex(
          (s) =>
            s.start.getTime() === slot.start.getTime() &&
            s.end.getTime() === slot.end.getTime()
        )
    );

    if (allAvailableSlots.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No available slots for the given date.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Available slots fetched successfully.",
      availableSlots: allAvailableSlots.map((slot) => ({
        startTime: slot.start.toTimeString().slice(0, 5),
        endTime: slot.end.toTimeString().slice(0, 5),
      })),
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getUserReservations = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const reservations = await Reservation.find({ customerId: userId })
      .populate("restaurantId", "name address")
      .populate("tableId", "tableNumber capacity")
      .sort({ reservationDate: 1 });

    if (reservations.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No reservations found for this user",
        });
    }

    res.status(200).json({
      success: true,
      message: "Reservations retrieved successfully",
      data: reservations,
    });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  deleteReservation,
  getAvailableTableAndSlots,
  getAvailableSlots,
  cancelReservation,
  getAvailableTable,
  getUserReservations,
};
