const fs = require('fs');
const content = fs.readFileSync('tsc_errors_final_2.txt', 'utf8');
const lines = content.split(/\r?\n/);
const errors = {};

for (const line of lines) {
    const match = line.match(/error (TS\d+):/);
    if (match) {
        const code = match[1];
        errors[code] = (errors[code] || 0) + 1;
    }
}

console.log(JSON.stringify(errors, null, 2));

const ts2322 = lines.filter(l => l.includes('TS2322')).slice(0, 5);
const ts2345 = lines.filter(l => l.includes('TS2345')).slice(0, 5);

console.log('Sample TS2322:', ts2322);
console.log('Sample TS2345:', ts2345);
