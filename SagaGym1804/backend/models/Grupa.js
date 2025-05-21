const mongoose = require("mongoose");
const grupaSchema = new mongoose.Schema({
  name: String,
  image: String,
  descriere: String
});
module.exports = mongoose.model("Grupa", grupaSchema);