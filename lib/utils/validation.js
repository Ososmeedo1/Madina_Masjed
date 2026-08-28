import { isValidDateString } from './timezone.js';
import { sanitizeText } from './sanitize.js';

export { isValidDateString };

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function clean(value, max = 200) {
  return sanitizeText(value, max);
}

export function isValidEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

export function isValidPassword(v) {
  return typeof v === 'string' && v.length >= 8 && v.length <= 72;
}

export function isValidName(v) {
  return typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 120;
}

export function isValidGroupKey(v) {
  return typeof v === 'string' && /^[a-z0-9-]{2,40}$/.test(v);
}

export const normalizeSpaces = (v) => sanitizeText(v, 600);

export function isValidStudentName(v) {
  const n = normalizeSpaces(v);
  return n.length >= 2 && n.length <= 100 && /^[\u0621-\u064Aa-zA-Z\s]+$/.test(n);
}

export function isValidRevision(v) {
  const n = normalizeSpaces(v);
  return (
    n.length >= 2 &&
    n.length <= 200 &&
    /^(سورة\s)?[\u0621-\u064A\s]+$/.test(n)
  );
}

export function isPositiveIntegerPageCount(v) {
  return Number.isInteger(v) && v >= 1 && v <= 1000;
}

export function isValidSardText(v) {
  const n = normalizeSpaces(v);
  return n.length >= 1 && n.length <= 500;
}

export const ABSENCE_REASONS_AR = {
  CONVERTED: 'تم التحويل من حضور',
};

export function isValidReasonText(v) {
  const n = normalizeSpaces(v ?? '');
  return n.length <= 500;
}

export function validateAbsenceInput(body = {}) {
  const errors = {};
  if (!isValidStudentName(body.studentName)) {
    errors.studentName = 'الاسم مطلوب (حروف فقط، حرفان على الأقل)';
  }
  if (body.reason !== undefined && body.reason !== null && String(body.reason).trim() !== '') {
    if (!isValidReasonText(body.reason)) {
      errors.reason = 'السبب طويل جداً (٥٠٠ حرف كحد أقصى)';
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateListenerInput(body = {}) {
  const errors = {};
  if (!isValidStudentName(body.studentName)) {
    errors.studentName = 'الاسم مطلوب (حروف فقط، حرفان على الأقل)';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateRegistrationInput(body = {}) {
  const errors = {};
  if (!isValidStudentName(body.studentName)) {
    errors.studentName = 'الاسم مطلوب (حروف فقط، حرفان على الأقل)';
  }
  if (!isValidRevision(body.revision)) {
    errors.revision = 'اسم السورة مطلوب (حروف عربية فقط)';
  }
  if (!isPositiveIntegerPageCount(body.pagesCount)) {
    errors.pagesCount = 'عدد الأوجه يجب أن يكون رقماً صحيحاً موجباً';
  }
  if (body.countOfSard !== undefined && body.countOfSard !== null && String(body.countOfSard).trim() !== '') {
    if (!isValidSardText(body.countOfSard)) {
      errors.countOfSard = 'عدد السرد طويل جداً (٥٠٠ حرف كحد أقصى)';
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateEditFields(body = {}, targetStatus) {
  const errors = {};
  const cleaned = {};

  const hasExplicitStatus = targetStatus !== undefined;

  if (body.studentName !== undefined) {
    if (!isValidStudentName(body.studentName)) errors.studentName = 'الاسم مطلوب (حروف فقط، حرفان على الأقل)';
    else cleaned.studentName = normalizeSpaces(body.studentName);
  }

  if (body.status !== undefined) {
    if (body.status !== 'present' && body.status !== 'absent' && body.status !== 'listener') {
      errors.status = 'قيمة الحالة غير صالحة';
    } else {
      cleaned.status = body.status;
    }
  }

  const effectiveStatus = targetStatus ?? body.status;

  if (hasExplicitStatus) {
    if (effectiveStatus === 'present') {
      if (body.revision !== undefined) {
        if (!isValidRevision(body.revision)) errors.revision = 'اسم السورة مطلوب (حروف عربية فقط)';
        else cleaned.revision = normalizeSpaces(body.revision);
      }
      if (body.pagesCount !== undefined) {
        if (!isPositiveIntegerPageCount(body.pagesCount)) errors.pagesCount = 'عدد الأوجه يجب أن يكون رقماً صحيحاً موجباً';
        else cleaned.pagesCount = body.pagesCount;
      }
      if (body.countOfSard !== undefined) {
        if (body.countOfSard === null || String(body.countOfSard).trim() === '') {
          cleaned.countOfSard = null;
        } else if (!isValidSardText(body.countOfSard)) {
          errors.countOfSard = 'عدد السرد طويل جداً (٥٠٠ حرف كحد أقصى)';
        } else {
          cleaned.countOfSard = normalizeSpaces(body.countOfSard);
        }
      }
    } else if (effectiveStatus === 'absent') {
      if (body.reason !== undefined) {
        if (!isValidReasonText(body.reason)) errors.reason = 'السبب طويل جداً (٥٠٠ حرف كحد أقصى)';
        else cleaned.reason = normalizeSpaces(body.reason ?? '');
      }
    }
  } else {
    if (body.revision !== undefined) {
      if (!isValidRevision(body.revision)) errors.revision = 'اسم السورة مطلوب (حروف عربية فقط)';
      else cleaned.revision = normalizeSpaces(body.revision);
    }
    if (body.pagesCount !== undefined) {
      if (!isPositiveIntegerPageCount(body.pagesCount)) errors.pagesCount = 'عدد الأوجه يجب أن يكون رقماً صحيحاً موجباً';
      else cleaned.pagesCount = body.pagesCount;
    }
    if (body.countOfSard !== undefined) {
      if (body.countOfSard === null || String(body.countOfSard).trim() === '') {
        cleaned.countOfSard = null;
      } else if (!isValidSardText(body.countOfSard)) {
        errors.countOfSard = 'عدد السرد طويل جداً (٥٠٠ حرف كحد أقصى)';
      } else {
        cleaned.countOfSard = normalizeSpaces(body.countOfSard);
      }
    }
    if (body.reason !== undefined) {
      if (!isValidReasonText(body.reason)) errors.reason = 'السبب طويل جداً (٥٠٠ حرف كحد أقصى)';
      else cleaned.reason = normalizeSpaces(body.reason ?? '');
    }
  }

  if (Object.keys(cleaned).length === 0 && Object.keys(errors).length === 0) {
    errors._form = 'لا توجد بيانات للتحديث';
  }

  return { ok: Object.keys(errors).length === 0, errors, cleaned };
}

export function validateSetupInput(body = {}) {
  const errors = {};
  if (!isValidEmail(body.email)) errors.email = 'البريد الإلكتروني غير صالح';
  if (!isValidPassword(body.password)) errors.password = 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل';
  if (body.confirmPassword !== body.password) {
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateLoginInput(body = {}) {
  const errors = {};
  if (!isValidEmail(body.email)) errors.email = 'البريد الإلكتروني غير صالح';
  if (!body.password) errors.password = 'كلمة المرور مطلوبة';
  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateChangePasswordInput(body = {}) {
  const errors = {};
  if (!body.currentPassword) errors.currentPassword = 'كلمة المرور الحالية مطلوبة';
  if (!isValidPassword(body.newPassword)) {
    errors.newPassword = 'كلمة المرور الجديدة ٨ أحرف على الأقل';
  } else if (body.newPassword === body.currentPassword) {
    errors.newPassword = 'كلمة المرور الجديدة مطابقة للحالية';
  }
  if (body.confirmPassword !== body.newPassword) {
    errors.confirmPassword = 'تأكيد كلمة المرور غير مطابق';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
