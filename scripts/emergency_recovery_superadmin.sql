-- Reset mật khẩu tài khoản admin/super admin về: Admin@123456
UPDATE users 
SET password_hash = '$2a$10$y5.xOiBc6BR9NTbX3V4dF.6SGNamXlf2SyZ5YZFVI/iTPXF8nlhai',
    updated_at = CURRENT_TIMESTAMP
WHERE role = 'SUPER_ADMIN' OR username = 'admin';

SELECT id, username, email, role, is_active, updated_at 
FROM users 
WHERE role = 'SUPER_ADMIN';
