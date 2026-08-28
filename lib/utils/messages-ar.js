const STATUS_FALLBACK = {
  408: 'انتهت مهلة الطلب، حاول مرة أخرى',
  422: 'تعذر معالجة البيانات المرسلة',
  400: 'تحقق من البيانات المدخلة',
  401: 'انتهت الجلسة، يرجى تسجيل الدخول من جديد',
  403: 'غير مصرح لك بهذا الإجراء',
  404: 'العنصر المطلوب غير موجود',
  409: 'هذا السجل موجود مسبقاً',
  429: 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة',
  500: 'خطأ في الخادم، حاول مرة أخرى لاحقاً',
  503: 'الخدمة غير متاحة حالياً، حاول بعد قليل',
};

/**
 * Choose the best Arabic error text for a failed API response:
 * server message → caller fallback → status-code mapping → generic default.
 * @param {{message?: string}|null} data Parsed JSON body (may be null).
 * @param {number} status HTTP status code.
 * @param {string} [fallback] Optional caller-provided default.
 * @returns {string}
 */
export function apiErrorAr(data, status, fallback) {
  if (data && typeof data.message === 'string' && data.message.length > 0) return data.message;
  if (typeof fallback === 'string' && fallback.length > 0) return fallback;
  return STATUS_FALLBACK[status] || 'حدث خطأ غير متوقع';
}

export { STATUS_FALLBACK };
