const mongoose = require("mongoose");

const workoutActivitySchema = new mongoose.Schema({
  id_user: String,
  id_workout: String,
  wk_cnt: Number, 
  duration: Number
}, {
  timestamps: true 
});


module.exports = mongoose.model("WorkoutActivity", workoutActivitySchema);
