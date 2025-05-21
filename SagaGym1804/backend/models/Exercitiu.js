const mongoose = require("mongoose");
const exercitiuSchema = new mongoose.Schema({
  id_exercitiu: Number,
  name: String,
  type: String,
  cover_image: String,
  rating: Number,
  muscle_groups: [String],
  images: [String],
});
module.exports = mongoose.model("Exercitiu", exercitiuSchema);