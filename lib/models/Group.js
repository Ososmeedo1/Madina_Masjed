import mongoose from 'mongoose';

const { Schema } = mongoose;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const groupSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['group-1', 'group-2'],
    },
    name: {
      type: String,
      required: [true, 'اسم المجموعة مطلوب'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    startTime: {
      type: String,
      required: [true, 'وقت البداية مطلوب'],
      match: [TIME_RE, 'صيغة وقت البداية يجب أن تكون HH:MM'],
    },
    endTime: {
      type: String,
      required: [true, 'وقت النهاية مطلوب'],
      match: [TIME_RE, 'صيغة وقت النهاية يجب أن تكون HH:MM'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.models.Group ?? mongoose.model('Group', groupSchema);
