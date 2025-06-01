const mongoose = require("mongoose");
const tipSchema = new mongoose.Schema({
  name: String,
  image: String,
});
module.exports = mongoose.model("Tip", tipSchema);
