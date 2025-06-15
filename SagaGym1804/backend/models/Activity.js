const mongoose = require("mongoose");
const activitySchema = new mongoose.Schema({
  id_exercitiu: String,
  id_user: String,
  activity_cnt: Number,
  time: Number,
});
module.exports = mongoose.model("Activity", activitySchema);
