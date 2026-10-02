const fs = require('fs');

const rootVercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const newHeaders = [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "Content-Security-Policy-Report-Only",
        "value": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://yhemudxufpvxtqcqdofy.supabase.co; media-src 'self' blob: https://yhemudxufpvxtqcqdofy.supabase.co; font-src 'self' data:; connect-src 'self' https://yhemudxufpvxtqcqdofy.supabase.co wss://yhemudxufpvxtqcqdofy.supabase.co; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
      },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(self), microphone=(self), geolocation=()" },
      { "key": "X-Frame-Options", "value": "DENY" }
    ]
  },
  {
    "source": "/sw.js",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
  },
  {
    "source": "/manifest.json",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
  },
  {
    "source": "/_expo/static/(.*)",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  }
];

// In React Native Web, `unsafe-eval` is often needed for development, but in prod `expo export` usually doesn't need it.
// The docs/redesign/vercel.json didn't include `unsafe-eval`, I will remove it to match exactly what they gave, unless they specifically need it. Wait, the docs say: "não afrouxe com unsafe-inline nem unsafe-eval no script". So I'll remove 'unsafe-eval'.
newHeaders[0].headers[0].value = newHeaders[0].headers[0].value.replace(" 'unsafe-eval'", "");

// Merge headers: we already have some in rootVercel
// I will just append the new headers into rootVercel.headers. For duplicate paths, we could merge, but it's simpler to just combine them.
// Let's manually merge the /(.*) one so we don't have duplicates.
const rootCatchAll = rootVercel.headers.find(h => h.source === '/(.*)');
if (rootCatchAll) {
  rootCatchAll.headers.push(...newHeaders[0].headers);
} else {
  rootVercel.headers.push(newHeaders[0]);
}

// Add the rest
rootVercel.headers.push(...newHeaders.slice(1));

fs.writeFileSync('vercel.json', JSON.stringify(rootVercel, null, 2));

