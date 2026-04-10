const mongoose = require('mongoose');

// ── Placeholder patterns that mean the URI has NOT been configured ─────────
const INVALID_PATTERNS = [
  'PASTE_YOUR_ATLAS_URI_HERE',
  'REAL_CLUSTER_ID',
  'REAL_PASSWORD',
  'YOUR_PASSWORD',
  'YOUR_PASS',
  'YOUR_USER',
  '<password>',
  '<username>',
  '<cluster>',
  '<dbname>',
  'abcd123',
  'ab12cd3',
];


const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // ── 1. Must exist ──────────────────────────────────────────────────────────
  if (!uri) {
    printBox([
      '❌  MONGO_URI is missing from your .env file.',
      '',
      'Add this line to  backend/.env :',
      '  MONGO_URI=mongodb+srv://dharsan:YourPass@cluster0.xxxxx.mongodb.net/adms?retryWrites=true&w=majority',
    ]);
    process.exit(1);
  }

  // ── 2. Must not contain placeholder text ──────────────────────────────────
  const foundPlaceholder = INVALID_PATTERNS.find(p => uri.includes(p));
  if (foundPlaceholder || uri.includes('<') || uri.includes('>')) {
    printBox([
      '❌  MONGO_URI still contains a placeholder value!',
      `    Found: "${foundPlaceholder || '<>'}"`,
      '',
      '─── HOW TO FIX IN 3 STEPS ─────────────────────────────────────',
      '',
      ' STEP 1 → Log in to https://cloud.mongodb.com',
      '',
      ' STEP 2 → Click your Cluster → "Connect" → "Drivers"',
      '          Copy the string that looks like:',
      '          mongodb+srv://dharsan:PASSWORD@cluster0.ab1xyz.mongodb.net/?retryWrites=true&w=majority',
      '',
      ' STEP 3 → Open  backend/.env  and set:',
      '          MONGO_URI=mongodb+srv://dharsan:PASSWORD@cluster0.ab1xyz.mongodb.net/adms?retryWrites=true&w=majority',
      '          (add /adms before the ? — that is your database name)',
      '',
      '─── ATLAS CHECKLIST ────────────────────────────────────────────',
      '  ✔ Network Access  → Add IP 0.0.0.0/0',
      '  ✔ Database Access → user "dharsan" exists with a password',
      '  ✔ Cluster ID      → real value like ab1xyz, NOT abcd123',
      '',
      '  Then restart:  npm start',
    ]);
    process.exit(1);
  }

  // ── 3. Attempt real connection ────────────────────────────────────────────
  console.log('🔄 Connecting to MongoDB...');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected  →  ${conn.connection.host}`);
    console.log(`📦 Database          →  ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️  MongoDB disconnected — attempting reconnect...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('✅ MongoDB reconnected!')
    );
    mongoose.connection.on('error', err =>
      console.error('❌ MongoDB runtime error:', err.message)
    );

  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('   Error:', error.message);

    if (error.message.match(/ENOTFOUND|querySrv|EBADNAME/)) {
      printBox([
        '🔴 Cause: Cluster hostname is wrong / unreachable.',
        '',
        '  ▶ Your cluster ID in MONGO_URI is incorrect.',
        '  ▶ Get the correct string from Atlas → Connect → Drivers.',
        '  ▶ It looks like:  cluster0.ab1xyz.mongodb.net',
        '  ▶ Also check:     Atlas → Network Access → 0.0.0.0/0',
      ]);
    } else if (error.message.match(/Authentication failed|bad auth/i)) {
      printBox([
        '🔴 Cause: Wrong username OR password in MONGO_URI.',
        '',
        '  HOW TO FIX (2 minutes):',
        '',
        '  1. Go to  https://cloud.mongodb.com',
        '     → Database Access → find your user → click Edit',
        '     → Edit Password → enter a NEW password → Update User',
        '',
        '  2. Open  backend/.env  and update:',
        '     MONGO_URI=mongodb+srv://<user>:<NEW_PASSWORD>@<cluster>.mongodb.net/adms?retryWrites=true&w=majority',
        '',
        '  3. Make sure the user role is:',
        '     "Atlas Admin" OR "Read and write to any database"',
        '',
        '  Common mistake: password has special chars (@, #, %).',
        '  If so → URL-encode them, or use a simpler password.',
        '',
        '  ▶ Atlas → Network Access → must have  0.0.0.0/0  entry.',
      ]);
    } else if (error.message.includes('timed out')) {
      printBox([
        '🔴 Cause: Connection timed out.',
        '',
        '  ▶ Atlas → Network Access → Add IP Address → 0.0.0.0/0',
        '  ▶ Make sure your internet is connected.',
      ]);
    } else {
      printBox([
        '🔴 Unexpected connection error.',
        '',
        `  Error: ${error.message}`,
        '',
        '  ▶ Double-check MONGO_URI in backend/.env',
        '  ▶ Verify Atlas cluster is not paused (free tier pauses after 60d)',
      ]);
    }

    // Show safe partial URI (hide password)
    const safeUri = uri.replace(/:([^@]+)@/, ':****@');
    console.error('\n   MONGO_URI (password hidden):', safeUri, '\n');
    process.exit(1);
  }
};

// ── Helper: print a bordered box to the console ───────────────────────────
function printBox(lines) {
  const width = Math.max(...lines.map(l => l.length), 60);
  const bar = '─'.repeat(width + 2);
  console.error(`\n┌${bar}┐`);
  lines.forEach(l => console.error(`│ ${l.padEnd(width)} │`));
  console.error(`└${bar}┘\n`);
}

module.exports = connectDB;
