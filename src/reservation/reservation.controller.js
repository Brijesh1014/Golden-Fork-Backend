const Reservation = require("./reservation.model");

const createReservation = async (req, res) => {
  try {
    const {
      restaurantId,
      customerId,
      tableId,
      reservationDate,
      startTime,
      endTime,
      createdBy,
    } = req.body;

    if (
      !restaurantId ||
      !customerId ||
      !tableId ||
      !reservationDate ||
      !startTime ||
      !endTime 
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const userId = req.userId
    const existingReservation = await Reservation.findOne({
      tableId,
      reservationDate: new Date(reservationDate),
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      status: { $in: ["Pending", "Confirmed"] },
    });

    if (existingReservation) {
      return res
        .status(400)
        .json({ error: "The table is already reserved for this time slot." });
    }

    const reservation = new Reservation({
      restaurantId,
      customerId,
      tableId,
      reservationDate: new Date(reservationDate),
      startTime,
      endTime,
      createdBy:userId,
    });

    await reservation.save();

    res.status(201).json({
      message: "Reservation created successfully.",
      reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("restaurantId", "name")
      .populate("customerId", "name email")
      .populate("tableId", "number capacity");

    res.status(200).json(reservations);
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


const getAvailableSlots = async (req, res) => {
    try {
      const { restaurantId, reservationDate, tableId } = req.query;
  
      if (!restaurantId || !reservationDate) {
        return res.status(400).json({ error: "restaurantId and reservationDate are required." });
      }
  
      const date = new Date(reservationDate);
      const startBusinessHour = "08:00";
      const endBusinessHour = "22:00";
  
      const generateTimeSlots = (start, end) => {
        const slots = [];
        let current = start;
        while (current < end) {
          const next = new Date(current.getTime() + 30 * 60000);
          slots.push({ start: current, end: next });
          current = next;
        }
        return slots;
      };
  
      const slots = generateTimeSlots(
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
  
      const unavailableSlots = [];
  
      reservations.forEach((res) => {
        const reservedStart = new Date(`${reservationDate}T${res.startTime}`);
        const reservedEnd = new Date(`${reservationDate}T${res.endTime}`);
        
        unavailableSlots.push({
          start: reservedStart,
          end: reservedEnd
        });
      });
  

      const availableSlots = slots.filter((slot) => {
        return !unavailableSlots.some(
          (unSlot) =>
            slot.start < unSlot.end && slot.end > unSlot.start 
        );
      });
  
      res.status(200).json({
        message: "Available slots fetched successfully.",
        availableSlots: availableSlots.map((slot) => ({
          startTime: slot.start.toTimeString().slice(0, 5),
          endTime: slot.end.toTimeString().slice(0, 5),
        })),
      });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };


module.exports ={
    createReservation,
    getAllReservations,
    deleteReservation,
    getAvailableSlots,
    cancelReservation
}