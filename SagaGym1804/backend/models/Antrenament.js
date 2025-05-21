const mongoose = require("mongoose");
const antrenamentSchema = new mongoose.Schema({
  id_antrenament: Number,
  name: String,
  type: String,
  user_email: String,
  created_at: Date
});
module.exports = mongoose.model("Antrenament", antrenamentSchema);