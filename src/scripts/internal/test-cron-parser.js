const cp = require('cron-parser');
console.log('Exports:', Object.keys(cp));
console.log('Type:', typeof cp);
if (typeof cp === 'object') {
    console.log('Has parseExpression:', typeof cp.parseExpression);
}
