import path from 'path';
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
const target = path.resolve(__dirname, '../src/lib/db.ts');
console.log('Target Path:', target);
import fs from 'fs';
console.log('Exists:', fs.existsSync(target));
