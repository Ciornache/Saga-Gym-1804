const mongoose = require("mongoose");

const setInfoSchema = new mongoose.Schema({
  id_exercitiu: String,
  id_user: String,
  weight_type: String,
  weight_kicker: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SetInfo", setInfoSchema);
