const mongoose = require("mongoose");
const Workout_ex = require("./Workout_ex");
const antrenamentSchema = new mongoose.Schema({
  id_antrenament: Number,
  exercitii: [Workout_ex],
  id_user: String,
  name: String,
});
module.exports = mongoose.model("Antrenament", antrenamentSchema);
