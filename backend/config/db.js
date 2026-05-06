
const mongoose = require('mongoose');

function resolveMongoUri() {
  const useAtlas =
    process.env.USE_ATLAS === 'true' || process.env.USE_ATLAS === '1';
  if (useAtlas) {
    const user = (process.env.MONGODB_ATLAS_USERNAME || '').trim();
    const pass = process.env.MONGODB_ATLAS_PASSWORD;
    const host =
      (process.env.MONGODB_ATLAS_HOST || '').trim() ||
      'cluster0.zsoakua.mongodb.net';
    if (!user || pass === undefined || pass === '') {
      return null;
    }
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(pass);
    return `mongodb+srv://${u}:${p}@${host}/rideflow?retryWrites=true&w=majority&appName=Cluster0`;
  }

  const explicit = (process.env.MONGODB_URI || '').trim();
  return explicit || null;
}

const connectDB = async () => {
  const uri = resolveMongoUri();
  if (!uri) {
    const useAtlas =
      process.env.USE_ATLAS === 'true' || process.env.USE_ATLAS === '1';
    console.error(
      useAtlas
        ? 'MongoDB: USE_ATLAS=true — set MONGODB_ATLAS_USERNAME and MONGODB_ATLAS_PASSWORD (Atlas → Database Access).'
        : 'MongoDB: set MONGODB_URI (e.g. mongodb://localhost:27017/rideflow) or enable Atlas with USE_ATLAS=true.'
    );
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
