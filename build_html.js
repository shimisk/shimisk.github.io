/**
 * Valheim Companion — build_html.js
 * Run this once on your machine to pre-compile the JSX and
 * generate a final index.html with no runtime Babel dependency.
 *
 * Requirements: Node.js installed (https://nodejs.org)
 *
 * Setup (one time only):
 *   npm install @babel/core @babel/plugin-transform-react-jsx
 *
 * Then run:
 *   node build_html.js
 *
 * Output: index.html  ← upload this to GitHub Pages
 */

const fs   = require('fs');
const path = require('path');
const babel = require('@babel/core');

// ─── Read source ──────────────────────────────────────────────────────────────
let jsx = fs.readFileSync('valheim-companion.jsx', 'utf8');

// Normalize line endings to avoid parse issues on Windows (CRLF)
jsx = jsx.replace(/\r\n/g, '\n');

// Strip EVERYTHING that shouldn't be in the final bundle — do this unconditionally
jsx = jsx.replace(/^const \{ useState[^\n]+\n\n?/m, '');   // remove existing hooks line
jsx = jsx.replace(/^import \{[^}]+\} from ['"]react['"];\r?\n/m, ''); // remove import
jsx = jsx.replace('export default function ValheimApp()', 'function ValheimApp()');

// Now add hooks globals once, cleanly at the top
jsx = 'const { useState, useMemo, useEffect, useRef } = React;\n\n' + jsx;

// Append mount call
jsx += '\n\nconst _root = ReactDOM.createRoot(document.getElementById("root"));\n_root.render(React.createElement(ValheimApp));\n';

// ─── Compile JSX → plain JS ───────────────────────────────────────────────────
console.log('Compiling JSX...');
const result = babel.transformSync(jsx, {
  plugins: ['@babel/plugin-transform-react-jsx'],
  // No module transform needed — this runs in a plain <script> tag
});

const compiledJS = result.code;
console.log(`Compiled: ${(compiledJS.length / 1024).toFixed(0)} KB`);

// ─── Build final HTML ─────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0d0f0e" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Valheim" />
  <link rel="apple-touch-icon" href="icon.png" />
  <title>Valheim Companion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0d0f0e; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script>
${compiledJS}
  </script>
</body>
</html>`;

fs.writeFileSync('index.html', html, 'utf8');
console.log(`Done! index.html ready — ${(html.length / 1024).toFixed(0)} KB`);
console.log('Upload index.html to GitHub Pages.');
