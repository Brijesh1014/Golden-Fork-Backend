const cron = require("node-cron");
const Table = require("../table/table.model");
const Reservation = require("../reservation/reservation.model");

const convertToCronTime = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return `${minutes} ${hours} * * *`; 
  };
  
  const calculateEndTime = (startTime, durationMinutes = 3) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
  
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toTimeString().slice(0, 5); 
  };
  
  async function scheduleCronJobs() {
    try {
      const reservations = await Reservation.find().select("tableId _id startTime reservationDate");
  
      const formattedReservations = reservations.map((reservation) => {
        const { _id: reservationId, tableId, startTime, reservationDate } = reservation;
        return { reservationId, tableId, startTime, reservationDate };
      });
  
      console.log("Formatted Reservations:", formattedReservations);
      if(formattedReservations.length > 0){
      formattedReservations.forEach((reservation) => {
        const { reservationId, tableId, startTime, reservationDate } = reservation;
        const endTime = calculateEndTime(startTime, 90);
        cron.schedule(convertToCronTime(endTime), async () => {
          console.log(`[Cron] Ending reservation ${reservationId} for table ${tableId} at ${endTime}`);
          try {
            await Table.updateOne(
              {
                _id: tableId,
              },
              {
                $pull: {
                  availability: {
                    date: new Date(reservationDate),
                    startTime: startTime,
                  },
                },
              }
            );
            console.log(`[Cron] Removed availability record for table ${tableId} and reservation ${reservationId}`);
            
            console.log(`[Cron] Table ${tableId} marked as available after reservation ${reservationId}`);
            await Reservation.findByIdAndUpdate(reservationId, { status: "Completed" });
            console.log(`[Cron] Reservation ${reservationId} marked as completed`);
          } catch (error) {
            console.error(`[Cron] Error marking table ${tableId} as available or completing reservation:`, error);
          }
        });
      });
      }
  
  
    } catch (error) {
      console.error("[ScheduleCronJobs] Error scheduling cron jobs:", error);
    }
  }

  module.exports = scheduleCronJobs