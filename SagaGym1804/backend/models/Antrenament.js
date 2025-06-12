const mongoose = require("mongoose");
const antrenamentSchema = new mongoose.Schema({
  id_antrenament: Number,
  exercitii: [Number]
});
module.exports = mongoose.model("Antrenament", antrenamentSchema);