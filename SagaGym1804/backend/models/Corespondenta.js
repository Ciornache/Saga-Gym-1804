const mongoose = require("mongoose");
const coresSchema = new mongoose.Schema({
  id_antrenament: Number,
  id_exercitiu: Number,
  ordine: Number,
  repetari: Number,
  pauza_secunde: Number
});
module.exports = mongoose.model("Corespondenta", coresSchema);