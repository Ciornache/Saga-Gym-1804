const mongoose = require("mongoose");
const Set = require("./Set");
const workoutExSchema = new mongoose.Schema({
  id: Number,
  sets: [Set],
  exercise_id: Number,
  duration: Number,
  muscle_groups: [String],
});
module.exports = workoutExSchema;
