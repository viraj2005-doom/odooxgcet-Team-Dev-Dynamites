// Script to generate a secure random session secret
import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n🔐 Generated Secure Session Secret:');
console.log('='.repeat(60));
console.log(secret);
console.log('='.repeat(60));
console.log('\n📝 Add this to your .env file:');
console.log(`SESSION_SECRET=${secret}\n`);

