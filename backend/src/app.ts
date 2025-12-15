import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import urlRoutes from './routes/urlRoutes'; // Import the map
import { initWorker } from './services/worker';
import { connectDB } from './config/db';
import { redirectLink } from './controllers/urlController';
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
app.use('/api/url', urlRoutes);
app.get('/:shortCode', redirectLink);

// 1. Basic Route
app.get('/', (req, res) => {
    res.send('🚀 Linkify Pro Backend is Running!');
});

// 2. Test Connections
// Ensure DB is connected before starting worker and server
async function main() {
    try {
        await connectDB();

        // Start background worker
        initWorker();

        // Quick Redis connectivity check
        const redis = new Redis(); // connects to localhost:6379 (Docker)
        await redis.set('test', 'Redis is working');
        console.log('✅ Redis Connected');

        app.listen(PORT, () => {
            console.log(`🔥 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Startup Failed:', error);
        process.exit(1);
    }
}

main();


// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { connectDB } from './config/db';
// import urlRoutes from './routes/urlRoutes';

// // 1. Load Environment Variables
// dotenv.config();

// // 2. Connect to Laws of Physics (Database)
// connectDB();

// const app = express();

// // 3. Middleware (The Gatekeepers)
// app.use(cors()); // Allow React to talk to us
// app.use(express.json()); // Parse JSON bodies

// // 4. Mount Routes (The Map)
// app.use('/api/url', urlRoutes);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 God Mode Server running on port ${PORT}`);
// });