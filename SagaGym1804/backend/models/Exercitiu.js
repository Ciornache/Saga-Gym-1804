const mongoose = require("mongoose");
const exercitiuSchema = new mongoose.Schema({
  id: Number,
  name: String,
  type: String,
  cover_image: String,
  rating: Number,
  difficulty: Number,
  muscle_groups: [String],
  images: [String],
  risk: String,
  description: String,
  video: String,
});
module.exports = mongoose.model("Exercitiu", exercitiuSchema);
