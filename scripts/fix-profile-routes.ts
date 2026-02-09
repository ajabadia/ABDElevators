import fs from 'fs';
import path from 'path';

const filesToUpdate = [
    'src/components/profile/UserNotificationPreferencesForm.tsx',
    'src/components/profile/ProfilePhotoUpload.tsx',
    'src/components/profile/ProfileForm.tsx',
    'src/components/profile/ActiveSessionsForm.tsx',
    'src/app/(authenticated)/(admin)/admin/profile/page.tsx',
    'src/app/api/auth/profile/sesiones/route.ts',
    'src/app/api/auth/profile/upload-photo/route.ts'
];

filesToUpdate.forEach(file => {
    const absolutePath = path.join(process.cwd(), file);
    if (fs.existsSync(absolutePath)) {
        let content = fs.readFileSync(absolutePath, 'utf8');
        const updatedContent = content.replace(/\/api\/auth\/perfil/g, '/api/auth/profile');
        if (content !== updatedContent) {
            fs.writeFileSync(absolutePath, updatedContent);
            console.log(`Updated ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }
    } else {
        console.error(`File not found: ${file}`);
    }
});
