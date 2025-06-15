const mongoose = require("mongoose");
const repetitionSchema = require("./Repetition");
const setSchema = new mongoose.Schema({
  id: Number,
  repetitions: [repetitionSchema],
  pause: Number,
  duration: Number,
  timings: [Object],
});
module.exports = setSchema;
