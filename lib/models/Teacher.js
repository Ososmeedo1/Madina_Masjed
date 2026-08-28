import mongoose from 'mongoose';

const { Schema } = mongoose;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const teacherSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [EMAIL_RE, 'البريد الإلكتروني غير صالح'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

teacherSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

export default mongoose.models.Teacher ?? mongoose.model('Teacher', teacherSchema);
