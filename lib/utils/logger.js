const isProd = process.env.NODE_ENV === 'production';

function write(level, tag, meta) {
  if (level === 'error' && isProd && meta && typeof meta === 'object' && meta.status && meta.status < 500) {
    return;
  }
  const parts = [new Date().toISOString(), level.toUpperCase(), tag];
  if (meta !== undefined) {
    parts.push(typeof meta === 'string' ? meta : JSON.stringify(meta));
  }
  const line = parts.join(' | ');
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (tag, meta) => write('info', tag, meta),
  error: (tag, meta) => write('error', tag, meta),
};
