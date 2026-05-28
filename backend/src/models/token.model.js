import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes expired tokens
    },
  },
  {
    timestamps: true,
  }
);

// ─── Static Methods ──────────────────────────────────────

/**
 * Store a new refresh token.
 */
refreshTokenSchema.statics.createToken = function (userId, token, expiresAt) {
  return this.create({ userId, token, expiresAt });
};

/**
 * Find a token record and populate the user.
 */
refreshTokenSchema.statics.findByToken = function (token) {
  return this.findOne({ token }).populate("userId");
};

/**
 * Delete a specific token (logout / rotation).
 */
refreshTokenSchema.statics.deleteByToken = function (token) {
  return this.deleteMany({ token });
};

/**
 * Delete ALL tokens for a user (force logout everywhere).
 */
refreshTokenSchema.statics.deleteAllForUser = function (userId) {
  return this.deleteMany({ userId });
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
