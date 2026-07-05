-- PRODUCTION SEED DATA
-- Chèn phòng ban 
INSERT INTO departments (code, name) 
VALUES ('IT', 'Phòng Công nghệ thông tin')
ON CONFLICT (code) DO NOTHING;

-- Chèn tài khoản Administrator tối cao mặc định
-- Mật khẩu mặc định là: Admin@123456
-- Admin phải đổi mật khẩu ngay sau lần đăng nhập đầu tiên
INSERT INTO users (id, username, email, password_hash, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'admin', 
  'admin@company.com', 
  '$2a$10$y5.xOiBc6BR9NTbX3V4dF.6SGNamXlf2SyZ5YZFVI/iTPXF8nlhai', 
  'SUPER_ADMIN', 
  true
)
ON CONFLICT (username) DO NOTHING;

-- Chèn thông tin hồ sơ cho tài khoản Administrator
INSERT INTO user_infos (user_id, full_name, department_id)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'System Administrator', 
  (SELECT id FROM departments WHERE code = 'IT')
)
ON CONFLICT (user_id) DO NOTHING;

-- Chèn các danh mục thiết bị tiêu chuẩn mặc định
INSERT INTO categories (id, code, name, description, specification_schema)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'LAPTOP', 'Máy tính xách tay', 'Thiết bị máy tính cá nhân di động', '{"cpu": "string", "ram": "string", "storage": "string"}'),
('c1000000-0000-0000-0000-000000000002', 'MONITOR', 'Màn hình máy tính', 'Thiết bị hiển thị đầu ra hình ảnh', '{"size": "string", "resolution": "string", "panel": "string"}'),
('c1000000-0000-0000-0000-000000000003', 'KEYBOARD', 'Bàn phím', 'Thiết bị nhập liệu văn bản', '{"type": "string", "switch": "string"}'),
('c1000000-0000-0000-0000-000000000004', 'MOUSE', 'Chuột máy tính', 'Thiết bị điều khiển trỏ chuột', '{"connection": "string", "dpi": "integer"}'),
('c1000000-0000-0000-0000-000000000005', 'PRINTER', 'Máy in', 'Thiết bị in ấn văn bản tài liệu', '{"technology": "string", "color": "boolean"}')
ON CONFLICT (code) DO NOTHING;
