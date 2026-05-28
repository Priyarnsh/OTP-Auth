import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatarUrl: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      // Clean up the output when converting to JSON
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Static Methods ──────────────────────────────────────

/**
 * Find a user by email or phone.
 * @param {"email"|"phone"} type
 * @param {string} identifier
 */
userSchema.statics.findByIdentifier = function (type, identifier) {
  if (type === "email") return this.findOne({ email: identifier });
  if (type === "phone") return this.findOne({ phone: identifier });
  return null;
};

/**
 * Create a new verified user.
 * @param {"email"|"phone"} type
 * @param {string} identifier
 */
userSchema.statics.createUser = function (type, identifier) {
  const data = {
    [type]: identifier,
    [`is${type === "email" ? "Email" : "Phone"}Verified`]: true,
    lastLoginAt: new Date(),
  };
  return this.create(data);
};

/**
 * Mark a user's email or phone as verified and update lastLoginAt.
 */
userSchema.statics.markVerified = function (userId, type) {
  const field = type === "email" ? "isEmailVerified" : "isPhoneVerified";
  return this.findByIdAndUpdate(
    userId,
    { [field]: true, lastLoginAt: new Date() },
    { new: true }
  );
};

/**
 * Update user profile fields (only allowed fields).
 */
userSchema.statics.updateProfile = function (userId, data) {
  const allowedFields = ["name", "avatarUrl"];
  const filtered = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  return this.findByIdAndUpdate(userId, filtered, { new: true });
};

const User = mongoose.model("User", userSchema);

export default User;
