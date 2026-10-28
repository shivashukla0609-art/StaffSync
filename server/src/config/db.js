import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staffsync';
  const isCloudURI = uri.includes('mongodb+srv://') || uri.includes('mongodb.net');
  const timeoutMS = isCloudURI ? 15000 : 3000;

  try {
    console.log(`[MongoDB] Connecting to ${isCloudURI ? 'MongoDB Atlas Cloud' : 'Local MongoDB'}...`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMS,
      dbName: 'staffsync',
    });

    console.log(`[MongoDB] Connected successfully to: ${isCloudURI ? 'MongoDB Atlas (staffsync)' : uri}`);
  } catch (error) {
    console.warn(`[MongoDB] Connection attempt failed: ${error.message}`);
    
    if (isCloudURI && error.message.includes('IP that isn\'t whitelisted')) {
      console.warn(`[MongoDB Atlas] Network Access Note: Please ensure your current IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.`);
    }

    console.log(`[MongoDB] Initializing standalone MongoMemoryServer for uninterrupted execution...`);
    try {
      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'staffsync',
            port: 27017,
          },
        }).catch(async () => {
          return await MongoMemoryServer.create({
            instance: {
              dbName: 'staffsync',
            },
          });
        });
      }

      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri, { dbName: 'staffsync' });
      console.log(`[MongoDB] Standalone MongoDB server active at: ${memUri}`);
    } catch (memError) {
      console.error('[MongoDB] Critical fallback connection error:', memError.message);
      throw memError;
    }
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    console.error('Error closing DB:', err.message);
  }
};
