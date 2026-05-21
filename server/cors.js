function getAllowedOrigins() {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
  ]);

  if (process.env.CLIENT_URL) {
    origins.add(process.env.CLIENT_URL.trim());
  }

  return [...origins];
}

function corsOrigin(origin, callback) {
  const allowed = getAllowedOrigins();

  // Same-origin or non-browser clients (curl, server-side) have no Origin header
  if (!origin || allowed.includes(origin)) {
    callback(null, true);
    return;
  }

  console.warn(`CORS blocked for origin: ${origin}`);
  callback(null, false);
}

module.exports = { getAllowedOrigins, corsOrigin };
