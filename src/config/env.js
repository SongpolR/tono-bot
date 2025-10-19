export const env = {
  PORT: process.env.PORT || 3000,
  LINE_CHANNEL_ACCESS_TOKEN: required('LINE_CHANNEL_ACCESS_TOKEN'),
  LINE_CHANNEL_SECRET: required('LINE_CHANNEL_SECRET'),
  SLIPOK_API_KEY: required('SLIPOK_API_KEY'),
  SLIPOK_BRANCH_ID: required('SLIPOK_BRANCH_ID'),
  SLIPOK_QUOTA_WARN_THRESHOLD: process.env.SLIPOK_QUOTA_WARN_THRESHOLD || 10,
};

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
