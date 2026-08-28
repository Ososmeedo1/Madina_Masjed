export const ERROR_CODES = {
  INVALID_INPUT: 'البيانات المدخلة غير صحيحة',
  REGISTRATION_NOT_STARTED: 'لم يبدأ وقت التسجيل بعد',
  REGISTRATION_CLOSED: 'انتهى وقت التسجيل',
  HOLIDAY: 'اليوم إجازة',
  ALREADY_REGISTERED: 'تم تسجيل حضورك مسبقًا',
  TEACHER_ABSENT: 'المعلم غائب اليوم - لا يوجد تسجيل حضور',
  GROUP_NOT_FOUND: 'المجموعة غير موجودة',
  UNAUTHORIZED: 'غير مصرح به',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  INVALID_TIME_RANGE: 'وقت البداية يجب أن يكون قبل وقت النهاية',
  GROUP_TIME_CONFLICT: 'تتعارض أوقات المجموعتين',
  NOT_FOUND: 'غير موجود',
  INTERNAL_ERROR: 'حدث خطأ في النظام',
};

/**
 * Arabic message for a machine error code (falls back to INTERNAL_ERROR).
 * @param {string} code
 * @returns {string}
 */
export function errorByCode(code) {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
}

export function withCode(code, message) {
  return { code, message: message || ERROR_CODES[code] || code };
}
