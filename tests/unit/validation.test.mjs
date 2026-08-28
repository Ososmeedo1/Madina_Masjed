import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isValidEmail,
  isValidPassword,
  isValidStudentName,
  isValidRevision,
  isPositiveIntegerPageCount,
  isValidSardText,
  validateSetupInput,
  validateLoginInput,
  validateChangePasswordInput,
  validateRegistrationInput,
  validateListenerInput,
  validateEditFields,
} from '../../lib/utils/validation.js';

test('isValidEmail accepts normal addresses rejects junk', () => {
  assert.equal(isValidEmail('teacher@masjed.sa'), true);
  assert.equal(isValidEmail('a.b+c@sub.dom.org'), true);
  assert.equal(isValidEmail('no-at-sign'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail(''), false);
});

test('isValidPassword enforces 8..72 length', () => {
  assert.equal(isValidPassword('Passw0rd!123'), true);
  assert.equal(isValidPassword('short1!'), false);
  assert.equal(isValidPassword('x'.repeat(73)), false);
  assert.equal(isValidPassword(12345678), false);
});

test('student name accepts Arabic and Latin letters with spaces', () => {
  assert.equal(isValidStudentName('محمد أحمد'), true);
  assert.equal(isValidStudentName('Ahmed Ali'), true);
  assert.equal(isValidStudentName('م'), false);
  assert.equal(isValidStudentName('أحمد123'), false);
  assert.equal(isValidStudentName('  أحمد  '), true);
});

test('revision requires Arabic surah names with optional سورة prefix', () => {
  assert.equal(isValidRevision('البقرة'), true);
  assert.equal(isValidRevision('سورة يوسف'), true);
  assert.equal(isValidRevision('Al-Baqarah'), false);
  assert.equal(isValidRevision('يس 1-10'), false);
  assert.equal(isValidRevision('ا'), false);
});

test('pagesCount must be positive integer within mushaf range', () => {
  assert.equal(isPositiveIntegerPageCount(1), true);
  assert.equal(isPositiveIntegerPageCount(1000), true);
  assert.equal(isPositiveIntegerPageCount(0), false);
  assert.equal(isPositiveIntegerPageCount(-2), false);
  assert.equal(isPositiveIntegerPageCount(2.5), false);
  assert.equal(isPositiveIntegerPageCount('5'), false);
  assert.equal(isPositiveIntegerPageCount(1001), false);
});

test('countOfSard any non-empty text up to limit', () => {
  assert.equal(isValidSardText('خمسة أوجه'), true);
  assert.equal(isValidSardText('3'), true);
  assert.equal(isValidSardText('   '), false);
});

test('validateSetupInput checks email password confirm', () => {
  const ok = validateSetupInput({ email: 'a@b.co', password: '12345678', confirmPassword: '12345678' });
  assert.equal(ok.ok, true);

  const bad = validateSetupInput({ email: 'x', password: 'short', confirmPassword: 'other' });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['confirmPassword', 'email', 'password']);
});

test('validateLoginInput flags invalid email or missing password', () => {
  assert.equal(validateLoginInput({ email: 'a@b.co', password: 'x' }).ok, true);
  const bad = validateLoginInput({ email: 'bad', password: '' });
  assert.ok(bad.errors.email);
  assert.ok(bad.errors.password);
});

test('validateChangePasswordInput blocks mismatch and same-password reuse', () => {
  const bad = validateChangePasswordInput({
    currentPassword: 'oldpass123',
    newPassword: 'oldpass123',
    confirmPassword: 'different',
  });
  assert.ok(bad.errors.newPassword);
  assert.ok(bad.errors.confirmPassword);

  const ok = validateChangePasswordInput({
    currentPassword: 'oldpass123',
    newPassword: 'newpass456',
    confirmPassword: 'newpass456',
  });
  assert.equal(ok.ok, true);
});

test('validateRegistrationInput returns per-field Arabic errors', () => {
  const bad = validateRegistrationInput({ studentName: '', revision: 'X', pagesCount: 0, countOfSard: '' });
  for (const key of ['studentName', 'revision', 'pagesCount']) {
    assert.ok(bad.errors[key], key);
  }
  assert.equal(bad.errors.countOfSard, undefined);
  assert.equal(validateRegistrationInput({ studentName: 'سالم عمر', revision: 'الكهف', pagesCount: 8, countOfSard: 'ثمانية' }).ok, true);
});

test('validateRegistrationInput accepts empty countOfSard as optional', () => {
  const result = validateRegistrationInput({ studentName: 'سالم عمر', revision: 'الكهف', pagesCount: 8, countOfSard: '' });
  assert.equal(result.ok, true);
  assert.equal(result.errors.countOfSard, undefined);
});

test('validateEditFields validates only provided fields', () => {
  const partial = validateEditFields({ pagesCount: 7 });
  assert.equal(partial.ok, true);
  assert.deepEqual(partial.cleaned, { pagesCount: 7 });

  const bad = validateEditFields({ revision: 'abc' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.revision);

  const empty = validateEditFields({});
  assert.equal(empty.ok, false);
  assert.ok(empty.errors._form);
});

test('validateListenerInput requires only a valid student name', () => {
  const ok = validateListenerInput({ studentName: 'محمد المستمع' });
  assert.equal(ok.ok, true);

  const bad = validateListenerInput({ studentName: '' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.studentName);

  const short = validateListenerInput({ studentName: 'أ' });
  assert.equal(short.ok, false);
  assert.ok(short.errors.studentName);
});

test('validateEditFields accepts listener as valid status', () => {
  const result = validateEditFields({ status: 'listener' });
  assert.equal(result.ok, true);
  assert.equal(result.cleaned.status, 'listener');
});

test('validateEditFields rejects invalid status values', () => {
  const result = validateEditFields({ status: 'pending' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.status);
});

test('validateEditFields with targetStatus present requires revision, pagesCount; countOfSard optional', () => {
  const empty = validateEditFields({ status: 'present' }, 'present');
  assert.equal(empty.ok, true);
  assert.equal(empty.cleaned.revision, undefined);
  assert.equal(empty.cleaned.pagesCount, undefined);
  assert.equal(empty.cleaned.countOfSard, undefined);

  const complete = validateEditFields(
    { status: 'present', revision: 'البقرة', pagesCount: 5, countOfSard: 'خمسة' },
    'present'
  );
  assert.equal(complete.ok, true);
  assert.equal(complete.cleaned.revision, 'البقرة');
  assert.equal(complete.cleaned.pagesCount, 5);
  assert.equal(complete.cleaned.countOfSard, 'خمسة');

  const badPresent = validateEditFields(
    { status: 'present', revision: 'X', pagesCount: 0, countOfSard: '' },
    'present'
  );
  assert.equal(badPresent.ok, false);
  assert.ok(badPresent.errors.revision);
  assert.ok(badPresent.errors.pagesCount);
  assert.equal(badPresent.errors.countOfSard, undefined);

  const emptySard = validateEditFields(
    { status: 'present', revision: 'البقرة', pagesCount: 5, countOfSard: '' },
    'present'
  );
  assert.equal(emptySard.ok, true);
  assert.equal(emptySard.cleaned.countOfSard, null);
});

test('validateEditFields with targetStatus listener ignores present fields', () => {
  const withPresentFields = validateEditFields(
    { studentName: 'محمد', revision: 'البقرة', pagesCount: 5, countOfSard: 'خمسة', status: 'listener' },
    'listener'
  );
  assert.equal(withPresentFields.ok, true);
  assert.equal(withPresentFields.cleaned.studentName, 'محمد');
  assert.equal(withPresentFields.cleaned.status, 'listener');
  assert.equal(withPresentFields.cleaned.revision, undefined);
  assert.equal(withPresentFields.cleaned.pagesCount, undefined);
  assert.equal(withPresentFields.cleaned.countOfSard, undefined);

  const nameOnly = validateEditFields({ studentName: 'أحمد', status: 'listener' }, 'listener');
  assert.equal(nameOnly.ok, true);
});

test('validateEditFields with targetStatus absent requires studentName, reason optional', () => {
  const withReason = validateEditFields(
    { studentName: 'سالم', reason: 'سفر', status: 'absent' },
    'absent'
  );
  assert.equal(withReason.ok, true);
  assert.equal(withReason.cleaned.reason, 'سفر');

  const withoutReason = validateEditFields(
    { studentName: 'سالم', status: 'absent' },
    'absent'
  );
  assert.equal(withoutReason.ok, true);
});

test('conversion present→listener passes with only studentName and status', () => {
  const result = validateEditFields(
    { studentName: 'محمد', status: 'listener' },
    'listener'
  );
  assert.equal(result.ok, true);
  assert.equal(result.cleaned.status, 'listener');
  assert.equal(result.cleaned.revision, undefined);
});

test('conversion listener→present passes with all required fields', () => {
  const result = validateEditFields(
    { status: 'present', revision: 'يس', pagesCount: 3, countOfSard: 'ثلاثة' },
    'present'
  );
  assert.equal(result.ok, true);
});

test('conversion listener→present fails when present fields are invalid', () => {
  const result = validateEditFields(
    { status: 'present', revision: 'X', pagesCount: 0, countOfSard: '' },
    'present'
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.revision);
  assert.ok(result.errors.pagesCount);
  assert.equal(result.errors.countOfSard, undefined);
});
