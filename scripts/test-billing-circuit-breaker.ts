import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('--- Environment Check ---');
console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? 'PRESENT' : 'MISSING');
console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'PRESENT' : 'MISSING');
console.log('-------------------------\n');

// Importar después de cargar variables
const { BillingCircuitBreaker } = require('../src/lib/billing-circuit-breaker');
const { ExternalServiceError } = require('../src/lib/errors');

async function testCircuitBreaker() {
    console.log('--- Testing Billing Circuit Breaker ---\n');

    try {
        console.log('1. Resetting circuit state...');
        await BillingCircuitBreaker.reset();
        console.log('Circuit RESET OK.\n');

        console.log('2. Checking circuit (should be CLOSED/OK)...');
        await BillingCircuitBreaker.checkCircuit();
        console.log('Circuit CHECK OK.\n');

        console.log('3. Simulating 5 failures to open the circuit...');
        for (let i = 1; i <= 5; i++) {
            console.log(`Recording failure ${i}...`);
            await BillingCircuitBreaker.recordFailure(new Error(`Simulated Error ${i}`));
        }
        console.log('Failures recorded.\n');

        console.log('4. Checking circuit (should throw ExternalServiceError)...');
        try {
            await BillingCircuitBreaker.checkCircuit();
            console.error('FAIL: Circuit did not block request!');
        } catch (error: any) {
            if (error instanceof ExternalServiceError) {
                console.log('SUCCESS: Request blocked as expected.');
                console.log('Error Message:', error.message);
            } else {
                console.error('FAIL: Threw unexpected error:', error);
            }
        }
        console.log('\n');

        console.log('5. Testing manual reset...');
        await BillingCircuitBreaker.reset();
        console.log('6. Checking circuit (should be CLOSED/OK again)...');
        await BillingCircuitBreaker.checkCircuit();
        console.log('Circuit RESET/CHECK OK.\n');

        console.log('--- ALL TESTS PASSED ---');
        process.exit(0);
    } catch (error) {
        console.error('UNEXPECTED TEST FAILURE:', error);
        process.exit(1);
    }
}

testCircuitBreaker();
