/**************************************************************************
 * Blackfyre Server
 *  1) Short Alias Approach for SL Data
 *  2) Email Verification
 *  3) Character Management
 *  4) Admin Portal (+ dev back-door)
 *  5) Letters (viewer + inbox + API + give)
 **************************************************************************/

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');
const bodyParser = require('body-parser');
const rateLimit  = require('express-rate-limit');
const sql        = require('mssql');
const session    = require('express-session');
const crypto     = require('crypto');

/* -------------------------------------------------------------------- */
/* 1) Environment                                                       */
/* -------------------------------------------------------------------- */
const port         = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = {
  server  : process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options : { encrypt: false, trustServerCertificate: true }
};

if (!isProduction) {
  console.log('DB_SERVER :', process.env.DB_SERVER);
  console.log('DB_NAME   :', dbConfig.database);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
}
console.log('Using JWT_SECRET:', process.env.JWT_SECRET);

/* -------------------------------------------------------------------- */
/* 2) Express init                                                      */
/* -------------------------------------------------------------------- */
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

/* security / utility middleware ------------------------------------- */
app.use(helmet({
  crossOriginOpenerPolicy   : { policy: 'unsafe-none' },
  crossOriginEmbedderPolicy : false,
  crossOriginResourcePolicy : false,
  originAgentCluster        : false,
  contentSecurityPolicy     : false,
  hsts                      : false
}));
app.use(cors());
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret : process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave : false,
  saveUninitialized: false,
  cookie : { secure: isProduction }
}));

/* rate-limit -------------------------------------------------------- */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 1000,
  message : 'Too many requests, please try again later.'
}));

/* tiny logger ------------------------------------------------------- */
app.use((req, _res, next) => {
  console.log('→', req.method.padEnd(6), req.originalUrl);
  next();
});

/* -------------------------------------------------------------------- */
/* 3) DB connection                                                     */
/* -------------------------------------------------------------------- */
sql.connect(dbConfig)
  .then(() => console.log('Connected to SQL Server'))
  .catch(err => console.error('Database connection failed:', err));

/* -------------------------------------------------------------------- */
/* 4) Import routes                                                     */
/* -------------------------------------------------------------------- */
const slAuthRoute          = require('./routes/slAuth');
const tokenLoginRoute      = require('./routes/token-login');
const accountRoute         = require('./routes/accountroute');
const verifyRoutes         = require('./routes/verify');
const adminRoute           = require('./routes/adminroute');
const slAdminAuthRoute     = require('./routes/slAdminAuth');
const adminTokenLoginRoute = require('./routes/adminTokenLogin');

const hudSync              = require('./routes/hud-sync');
const hudSlotSync          = require('./routes/hud-slot-sync');
const slotSelectRoute = require("./routes/slot-select");

const createCharacterRoute = require('./routes/createcharacterroute');
const editCharacterRoute   = require('./routes/editcharacterroute');
const viewCharacterRoute   = require('./routes/viewcharacterroute');

const letterInboxRoute     = require('./routes/letterInbox');
const giveLetterRoute      = require('./routes/give-letter');   // NEW
const lettersRoute         = require('./routes/lettersroute');  // :id & ping

/* dev-only back-door ------------------------------------------------ */
let devAdminRoute = null;
if (!isProduction) devAdminRoute = require('./routes/devAdmin');

/* -------------------------------------------------------------------- */
/* 5) Mount routes (ORDER MATTERS)                                      */
/* -------------------------------------------------------------------- */
app.use('/sl-auth',           slAuthRoute);
app.use('/token-login',       tokenLoginRoute);
app.use('/account',           accountRoute);
app.use('/verify',            verifyRoutes);
app.use('/admin',             adminRoute);
app.use('/sl-admin-auth',     slAdminAuthRoute);
app.use('/admin-token-login', adminTokenLoginRoute);

app.use('/api/hud-slot-sync', hudSlotSync);
app.use('/api',               hudSync);
app.use("/api", slotSelectRoute);   // after other /api mounts

if (devAdminRoute) app.use('/dev-admin', devAdminRoute);

/* character flows */
app.use('/create-character',  createCharacterRoute);
app.use('/edit-character',    editCharacterRoute);
app.use('/view-character',    viewCharacterRoute);

/* letters:
     1) /letters/inbox
     2) /letters/give  (must be before generic /:id)
     3) viewer & API   (/:id, /ping, /)                              */
app.use('/letters', letterInboxRoute);
app.use('/letters', giveLetterRoute);   //  /letters/give
app.use('/letters', lettersRoute);      //  ping, create, :id

/* root -------------------------------------------------------------- */
app.get('/', (_req, res) =>
  res.send('🟢 Blackfyre API root – try /letters/ping'));

/* 404 --------------------------------------------------------------- */
app.use((_req, res) => res.status(404).json({ error: 'No such route' }));

/* -------------------------------------------------------------------- */
/* 6) Start server                                                     */
/* -------------------------------------------------------------------- */
app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`));
