import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/*
 * maxPoolSize caps sockets per instance. Too high and a few instances exhaust
 * the cluster's connection allowance; too low and requests queue against an
 * idle database. 10 measured as far too low on a long-running server: at 1500
 * concurrent requests Mongo was serving under 130 ops/sec with 41 connections
 * open while callers timed out waiting for one of ten sockets. Override per
 * deployment shape, lower for wide serverless fan-out.
 */
const opts = {
  bufferCommands: false,
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 100,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  waitQueueTimeoutMS: 10000,
};

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(`${process.env.MONGODB_URI}`, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    /* Without this the first failed connect is cached forever and every later
       request rejects against the same settled promise, long after Mongo is
       healthy again. */
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
