// src/services/storage/sync.js
import dotenv from 'dotenv';
dotenv.config();

import { ensureModels } from './db.js';

(async () => {
  await ensureModels();
  console.log('DB synced');
  process.exit(0);
})();
