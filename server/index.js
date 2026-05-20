/**
 * Express entry point.
 *
 * Boot sequence:
 *   1. authenticate() — fail fast if .env / Docker are wrong
 *   2. sync({ alter: true }) — keep schema in step with model files
 *   3. Listen.
 *
 * Note: the previous "ensureDefaultPeriod" auto-seeder is intentionally
 * removed. Deleted periods stay deleted; the user adds new ones from
 * the PeriodSelector's "+ Period" button.
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import db from './models/index.js';
import api from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { assertDbConnection, sequelize } from './config/sequelize.js';
import { clearColumnCache } from './utils/dbHelpers.js';
import { relaxCodeUniqueConstraints } from './utils/relaxIndexes.js';
import { pruneDuplicateIndexes } from './utils/pruneIndexes.js';

dotenv.config();

const app = express();

const isLocalhost = (origin) => {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch (_) { return false; }
};
const allowedFromEnv = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (allowedFromEnv.length === 0) return cb(null, isLocalhost(origin));
    return cb(null, allowedFromEnv.includes(origin) || isLocalhost(origin));
  },
  credentials: true,
}));
app.options('*', cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

let firstRequestLogged = false;
app.use((req, _res, next) => {
  if (!firstRequestLogged) {
    firstRequestLogged = true;
    console.log('[cors] first request received  origin=' + (req.headers.origin || '(none)') + '  path=' + req.path);
  }
  next();
});

app.use('/api', api);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 4000);

(async () => {
  console.log('[boot] starting…');
  console.log('[boot] DB target: ' + (process.env.DB_HOST || '127.0.0.1') + ':' + (process.env.DB_PORT || 3307) +
              ' / ' + (process.env.DB_NAME || 'course_assignment') +
              ' as user ' + (process.env.DB_USER || 'ca_user'));

  try {
    console.log('[boot] step 1: authenticate…');
    await assertDbConnection();
    console.log('[db] connected.');

    // Step 1.5: prune duplicate indexes that previous sync() calls
    // may have accumulated (Sequelize creates label_2, label_3, …
    // on repeated boots, eventually hitting MySQL's 64-key limit).
    // MUST run before sync, otherwise sync will fail with ER_TOO_MANY_KEYS.
    console.log('[boot] step 1.5: prune duplicate indexes…');
    await pruneDuplicateIndexes();

    console.log('[boot] step 2: sync (alter mode — adds missing columns)…');
    await sequelize.sync({ alter: true });
    console.log('[db] sync complete — schema matches models.');
    clearColumnCache();

    await relaxCodeUniqueConstraints();
    console.log('[db] code-unique constraints relaxed (cross-period clones can now insert).');

    console.log('[boot] no auto-seed (periods are user-managed).');
  } catch (err) {
    console.error('[db] boot failed.');
    console.error('     name:    ' + (err && err.name));
    console.error('     message: ' + (err && err.message));
    console.error('     code:    ' + (err && (err.code || err.original && err.original.code)));
    console.error('     errno:   ' + (err && (err.errno || err.original && err.original.errno)));
    console.error('     sqlMsg:  ' + (err && err.original && err.original.sqlMessage));
    console.error('     stack:');
    console.error(err && err.stack);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log('[api] listening on http://localhost:' + PORT);
    console.log('[api] CORS: ' + (allowedFromEnv.length ? 'env list = ' + allowedFromEnv.join(',') : 'any localhost (dev mode)'));
  });
})();
