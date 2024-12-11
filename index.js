const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config();
require("./src/config/db.connection");
const app = express();
const PORT = process.env.PORT || 4000;
const authRoute = require("./src/auth/auth.route");
const restaurantRoute = require("./src/restaurant/restaurant.route")
const menuRoute = require("./src/menus/menu.route");
const categoryItemRoute= require("./src/categoryItem/categoryItem.route");
const adminRoute = require("./src/admin/admin.route")
const userRoute = require("./src/user/user.route")
const tableRoute = require("./src/table/table.route")
const reservationRoute = require("./src/reservation/reservation.route")
const orderRoute  =  require("./src/order/order.route")
const cron = require("node-cron");
const scheduleCronJobs = require("./src/services/scheduleCronJobs");
const cmsPageRoute  = require("./src/cms/cms.route")
const contactUsRoute = require("./src/contactUs/contactUs.route");
const reportRoute = require("./src/report/report.route")
const generalSettingRoute = require("./src/generalSetting/generalSetting.route")
const categoryRoute = require("./src/category/category.route")
const kitchenRoute = require("./src/kitchen/kitchen.route")
app.set("view engine", "ejs");
const viewsDir = path.join(__dirname, "./src/views");
app.set("views", viewsDir);

const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", async function (req, res) {
  return res.send(
    `Server is running at ${
      req.protocol + "://" + req.hostname + ":" + PORT
    } 🧑🏽‍🚀💻 `
  );
});

cron.schedule('* * * * *', () => {
  scheduleCronJobs();
  console.log('Cron job is running every minute');
});

app.use("/api/auth", authRoute);
app.use("/api/restaurant",restaurantRoute)
app.use("/api/menu", menuRoute);
app.use("/api/categoryItem",categoryItemRoute);
app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);
app.use("/api/table", tableRoute);
app.use("/api/reservation", reservationRoute);
app.use("/api/order", orderRoute);
app.use("/api/cms", cmsPageRoute);
app.use("/api/contactUs", contactUsRoute);
app.use("/api/report", reportRoute);
app.use("/api/generalSetting", generalSettingRoute);
app.use("/api/category", categoryRoute);
app.use("/api/kitchen", kitchenRoute);

app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}!`);
});
