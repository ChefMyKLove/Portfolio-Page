const fs = require('fs');
const path = require('path');
const password = process.env.MYSTIC_PASSWORD;
if (!password) throw new Error('MYSTIC_PASSWORD not set in environment!');
const file = path.join(__dirname, 'blog', 'blook.js');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/__MYSTIC_PASSWORD__/g, password);
fs.writeFileSync(file, content, 'utf8');
console.log('Blog admin password injected into blook.js');
