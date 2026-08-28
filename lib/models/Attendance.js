import mongoose from 'mongoose';

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'المجموعة مطلوبة'],
    },
    studentName: {
      type: String,
      required: [true, 'اسم الطالب مطلوب'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['present', 'listener', 'absent'],
      default: 'present',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    revision: {
      type: String,
      required: [
        function () {
          return this.status === 'present';
        },
        'المراجعة مطلوبة',
      ],
      trim: true,
      minlength: 2,
      maxlength: 200,
      default: null,
    },
    pagesCount: {
      type: Number,
      required: [
        function () {
          return this.status === 'present';
        },
        'عدد الأوجه مطلوب',
      ],
      min: 1,
      max: 1000,
      validate: {
        validator: (v) => v === null || v === undefined || Number.isInteger(v),
        message: 'عدد الأوجه يجب أن يكون رقماً صحيحاً',
      },
      default: null,
    },
    countOfSard: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    attendanceDate: {
      type: Date,
      required: [true, 'تاريخ الحضور مطلوب'],
    },
    hijriDate: {
      type: String,
      required: true,
      index: true,
    },
    hijriDateFormatted: {
      type: String,
      required: true,
    },
    registeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    order: {
      type: Number,
      required: [
        function () {
          return this.status === 'present';
        },
      ],
      min: 1,
      default: null,
    },
    editTokenHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.editTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

attendanceSchema.index({ groupId: 1, attendanceDate: 1, studentName: 1 }, { unique: true });
// Sparse: absent records have no order and must not collide on null.
attendanceSchema.index({ groupId: 1, attendanceDate: 1, order: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ attendanceDate: 1 });
attendanceSchema.index({ hijriDate: 1, groupId: 1 });
attendanceSchema.index({ editTokenHash: 1 });

export default mongoose.models.Attendance ?? mongoose.model('Attendance', attendanceSchema);
