import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';
import Settings from '@/lib/models/Settings';
import { hashPassword } from '@/lib/utils/auth';
import { ensureDefaultGroups } from '@/lib/services/groups.service';

/**
 * Count teacher documents — non-zero means first-run setup is complete.
 * @returns {Promise<number>}
 */
export async function teacherCount() {
  await dbConnect();
  return Teacher.countDocuments();
}

/**
 * First-run bootstrap: create the admin teacher (409 if any teacher exists),
 * ensure the Settings singleton exists and seed the two default groups.
 * @param {{email: string, password: string}} input Validated credentials.
 * @returns {Promise<any>} Created Teacher document.
 * @throws {Error} With .status 409 when a teacher already exists.
 */
export async function createFirstTeacher({ email, password }) {
  await dbConnect();

  const existing = await Teacher.countDocuments();
  if (existing > 0) {
    const err = new Error('تم إنشاء حساب المعلم مسبقاً');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const teacher = await Teacher.create({ email, passwordHash, role: 'admin' });

  await Settings.getSingleton();
  await ensureDefaultGroups();

  return teacher;
}
