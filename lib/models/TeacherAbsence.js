import mongoose from 'mongoose';
import { getRiyadhDate } from '@/lib/utils/timezone';

const { Schema } = mongoose;

const teacherAbsenceSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    hijriDate: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * True when a TeacherAbsence record exists for today (Riyadh).
 * @returns {Promise<boolean>}
 */
teacherAbsenceSchema.statics.isAbsenceToday = function isAbsenceToday() {
  return this.exists({ date: getRiyadhDate(new Date()) }).then((r) => Boolean(r));
};

export default mongoose.models.TeacherAbsence ??
  mongoose.model('TeacherAbsence', teacherAbsenceSchema);
