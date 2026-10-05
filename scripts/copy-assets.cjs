const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.cpSync(path.join(root, 'assets'), path.join(root, 'dist/assets'), { recursive: true });
