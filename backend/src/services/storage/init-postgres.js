import { ensureModels } from './db.js';

(async () => {
  await ensureModels();
  console.log('Postgres initialized (extensions + indexes ensured).');
  process.exit(0);
})();
