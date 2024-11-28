const mongoose = require("mongoose");
require("dotenv").config();
const DB = process.env.MONGODB_URL;
const connection = mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database Connected Success");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = connection;
