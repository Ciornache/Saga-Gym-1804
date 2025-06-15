const mongoose = require('mongoose');

const reviewLikeSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Review'
  },
  userEmail: {
    type: String,
    required: true
  }
}, { timestamps: true });

reviewLikeSchema.index({ reviewId: 1, userEmail: 1 }, { unique: true });

module.exports = mongoose.model('ReviewLike', reviewLikeSchema);