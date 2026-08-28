import mongoose from 'mongoose';

const { Schema } = mongoose;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const settingsSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
      immutable: true,
    },
    mosqueName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'المدينة المنورة',
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh',
    },
    hijriOffsetDays: {
      type: Number,
      min: -2,
      max: 2,
      default: 0,
    },
    weeklyHolidays: {
      type: [String],
      enum: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      default: ['friday', 'saturday'],
    },
    attendance: {
      opensAt: {
        type: String,
        default: '05:00',
        match: [TIME_RE, 'وقت الفتح غير صالح'],
      },
      closesAt: {
        type: String,
        default: '23:00',
        match: [TIME_RE, 'وقت الإغلاق غير صالح'],
      },
      lateAfter: {
        type: String,
        default: '',
        match: [/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'وقت التأخر غير صالح'],
      },
      allowLateMarking: {
        type: Boolean,
        default: true,
      },
      editLockDays: {
        type: Number,
        min: 0,
        max: 90,
        default: 7,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret._id;
        delete ret.key;
        return ret;
      },
    },
  }
);

settingsSchema.statics.getSingleton = async function () {
  const existing = await this.findOne({ key: 'global' });
  if (existing) return existing;
  try {
    return await this.create({ key: 'global' });
  } catch (err) {
    const raced = await this.findOne({ key: 'global' });
    if (raced) return raced;
    throw err;
  }
};

export default mongoose.models.Settings ?? mongoose.model('Settings', settingsSchema);
