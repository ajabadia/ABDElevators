
import { UserRole } from '../types/roles';
console.log('User Roles:', Object.values(UserRole));
if (UserRole.COMPLIANCE && UserRole.REVIEWER) {
    console.log('✅ Roles OK');
} else {
    console.log('❌ Roles missing');
}
process.exit(0);
