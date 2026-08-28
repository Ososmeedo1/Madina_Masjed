import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongoose';

const DEFAULT_MAX_FAILURES = 8;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function collection() {
  return mongoose.connection.collection('rate_limits');
}

/**
 * Check whether a bucket has reached its failure threshold.
 * Backed by the Mongo rate_limits collection so limits hold across serverless instances.
 * @param {string} key Bucket key (e.g. "login:<ip>").
 * @param {{max?: number}} [opts]
 * @returns {Promise<boolean>} true when the action should be blocked.
 */
export async function isRateLimited(key, { max = DEFAULT_MAX_FAILURES } = {}) {
  await dbConnect();
  const now = new Date();
  const doc = await collection().findOne({ _id: key });

  if (!doc) return false;
  if (doc.resetAt <= now) {
    await collection().deleteOne({ _id: key });
    return false;
  }
  return doc.count >= max;
}

/**
 * Increment the failure counter for a key, starting a new window when needed.
 * @param {string} key
 * @param {{windowMs?: number}} [opts]
 * @returns {Promise<void>}
 */
export async function recordFailure(key, { windowMs = DEFAULT_WINDOW_MS } = {}) {
  await dbConnect();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const col = collection();

  await col.updateOne(
    { _id: key },
    [
      {
        $set: {
          count: { $cond: [{ $gt: ['$resetAt', now] }, { $add: ['$count', 1] }, 1] },
          resetAt: { $cond: [{ $gt: ['$resetAt', now] }, '$resetAt', resetAt] },
        },
      },
    ],
    { upsert: true }
  );

  if (Math.random() < 0.05) {
    await col.deleteMany({ resetAt: { $lte: now } });
  }
}

/**
 * Reset a bucket after a successful authenticated action.
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function clearFailures(key) {
  await dbConnect();
  await collection().deleteOne({ _id: key });
}
