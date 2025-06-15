const mongoose = require("mongoose");
const repetitionSchema = new mongoose.Schema({
  id: Number,
  duration: Number,
  timings: [Number],
});
module.exports = repetitionSchema; 
