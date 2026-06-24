CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments
(
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & AUTH
CREATE TABLE users
(
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE')),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_infos
(
    user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name     VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens
(
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_revoked ON refresh_tokens(user_id, is_revoked);

-- 3. CATEGORIES
CREATE TABLE categories
(
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                 VARCHAR(50) UNIQUE NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    description          TEXT,
    specification_schema JSONB,
    is_active            BOOLEAN DEFAULT TRUE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSETS
CREATE TABLE assets
(
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_code           VARCHAR(50) UNIQUE NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    category_id          UUID NOT NULL REFERENCES categories(id),
    serial_number        VARCHAR(100) UNIQUE,
    purchase_date        DATE,
    purchase_cost        DECIMAL(15,2),
    purchase_invoice_url VARCHAR(255),
    warranty_expiry      DATE,
    status               VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE','ASSIGNED','MAINTENANCE','LOST','BROKEN','PENDING_CONFIRMATION','RETIRED')),
    specification        JSONB,
    created_by           UUID REFERENCES users(id),
    deleted_at           TIMESTAMPTZ NULL,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. ALLOCATIONS
CREATE TABLE allocations
(
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id         UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_user_id     UUID REFERENCES users(id),
    to_user_id       UUID REFERENCES users(id),
    action_type      VARCHAR(20) NOT NULL CHECK (action_type IN ('ASSIGN', 'RETURN', 'TRANSFER')),
    event_time       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmation_status VARCHAR(20) CHECK (confirmation_status IN ('PENDING','CONFIRMED','REJECTED')),
    confirmed_at        TIMESTAMPTZ,
    confirmed_by        UUID REFERENCES users(id),
    notes            TEXT,
    handover_doc_url VARCHAR(255),
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_allocation_user_consistency CHECK (
        (action_type = 'ASSIGN'   AND from_user_id IS NULL     AND to_user_id IS NOT NULL) OR
        (action_type = 'RETURN'   AND from_user_id IS NOT NULL AND to_user_id IS NULL) OR
        (action_type = 'TRANSFER' AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL)
    ),
    CONSTRAINT chk_confirmation_scope CHECK (
        action_type <> 'RETURN' OR confirmation_status IS NULL
    )
);

-- 6. MAINTENANCE LOGS
CREATE TABLE maintenance_logs
(
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id          UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    handled_by        UUID NOT NULL REFERENCES users(id),
    provider_name     VARCHAR(100),
    repair_cost       DECIMAL(15,2) DEFAULT 0,
    issue_description TEXT NOT NULL,
    action_taken      TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')),
    start_date        DATE NOT NULL,
    end_date          DATE,
    created_by        UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. INVENTORY SESSIONS
CREATE TABLE inventory_sessions
(
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title      VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    status     VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    closed_at  TIMESTAMPTZ NULL
);

-- 8. INVENTORY ITEMS
CREATE TABLE inventory_items
(
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id     UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    asset_id       UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    checked_by     UUID NOT NULL REFERENCES users(id),
    checked_status VARCHAR(50) NOT NULL CHECK (checked_status IN ('FOUND','MISSING','DAMAGED','UNVERIFIED')),
    checked_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes          TEXT,
    UNIQUE(session_id, asset_id)
);

-- 9. SOFTWARE LICENSES
CREATE TABLE software_licenses
(
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_code         VARCHAR(50) UNIQUE NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    license_key          VARCHAR(255),
    total_seats          INTEGER NOT NULL DEFAULT 1 CHECK (total_seats > 0),
    expiration_date      DATE NULL,
    purchase_date        DATE,
    purchase_cost        DECIMAL(15,2),
    purchase_invoice_url VARCHAR(255),
    is_active            BOOLEAN DEFAULT TRUE,
    created_by           UUID REFERENCES users(id),
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. LICENSE ALLOCATIONS
CREATE TABLE license_allocations
(
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id   UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id),
    assigned_by  UUID NOT NULL REFERENCES users(id),
    allocated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    returned_at  TIMESTAMPTZ NULL,
    notes        TEXT,
    created_by   UUID REFERENCES users(id)
);

-- 11. NOTIFICATIONS
CREATE TABLE notifications
(
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type   VARCHAR(50) NOT NULL,
    recipient_email     VARCHAR(255) NOT NULL,
    recipient_name      VARCHAR(100),
    subject             VARCHAR(500),
    body                TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id   UUID,
    sent_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status              VARCHAR(20) DEFAULT 'SENT' CHECK (status IN ('SENT','FAILED','PENDING'))
);

-- 12. AUDIT LOGS
CREATE TABLE audit_logs
(
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id),
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    UUID NOT NULL,
    payload_diff JSONB NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. ATTACHMENTS
CREATE TABLE attachments
(
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID NOT NULL,
    file_type   VARCHAR(50) NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    file_name   VARCHAR(255),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- INDEXES
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_deleted ON assets(deleted_at);
CREATE INDEX idx_assets_warranty ON assets(warranty_expiry);
CREATE UNIQUE INDEX idx_assets_asset_code ON assets(asset_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_assets_serial ON assets(serial_number) WHERE serial_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_assets_specification ON assets USING gin(specification);

CREATE INDEX idx_allocations_asset ON allocations(asset_id);
CREATE INDEX idx_allocations_to_user ON allocations(to_user_id);
CREATE INDEX idx_allocations_from_user ON allocations(from_user_id);
CREATE INDEX idx_allocations_event_time ON allocations(event_time);
CREATE INDEX idx_allocations_current ON allocations(asset_id, event_time DESC)
    WHERE action_type IN ('ASSIGN', 'TRANSFER');
CREATE INDEX idx_allocations_pending_confirmation ON allocations(to_user_id, confirmation_status)
    WHERE confirmation_status = 'PENDING';

CREATE INDEX idx_maintenance_asset ON maintenance_logs(asset_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);

CREATE INDEX idx_inventory_session ON inventory_items(session_id);
CREATE INDEX idx_inventory_asset ON inventory_items(asset_id);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE INDEX idx_user_infos_department ON user_infos(department_id);

CREATE INDEX idx_license_allocations_license ON license_allocations(license_id);
CREATE INDEX idx_license_allocations_user ON license_allocations(user_id);
CREATE INDEX idx_license_allocations_active ON license_allocations(returned_at) WHERE returned_at IS NULL;

CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);

-- VIEWS
CREATE OR REPLACE VIEW v_asset_current_holder AS
SELECT DISTINCT ON (a.id)
    a.id AS asset_id,
    a.asset_code,
    a.name,
    u.id AS user_id,
    ui.full_name,
    u.email,
    ui.department_id,
    al.event_time AS assigned_at,
    al.confirmation_status,
    al.notes
FROM assets a
-- Chỉ join với các giao dịch hợp lệ làm thay đổi quyền sở hữu (cả đã xác nhận và đang chờ xác nhận)
         LEFT JOIN allocations al ON al.asset_id = a.id
    AND al.action_type IN ('ASSIGN', 'TRANSFER')
    AND al.confirmation_status IN ('CONFIRMED', 'PENDING')
    AND NOT EXISTS (
        -- Đảm bảo không có giao dịch RETURN hoặc TRANSFER nào MỚI HƠN đã cướp quyền sở hữu
        SELECT 1 FROM allocations al2
        WHERE al2.asset_id = a.id
          AND al2.event_time > al.event_time
          AND (
            (al2.action_type = 'RETURN') OR
            (al2.action_type = 'TRANSFER' AND al2.confirmation_status = 'CONFIRMED')
            )
    )
         LEFT JOIN users u ON al.to_user_id = u.id
         LEFT JOIN user_infos ui ON u.id = ui.user_id
WHERE a.deleted_at IS NULL
ORDER BY a.id, al.event_time DESC;

CREATE OR REPLACE VIEW v_license_usage AS
SELECT
    sl.id AS license_id,
    sl.license_code,
    sl.name,
    sl.total_seats,
    COUNT(la.id) FILTER (WHERE la.returned_at IS NULL) AS used_seats,
    sl.total_seats - COUNT(la.id) FILTER (WHERE la.returned_at IS NULL) AS available_seats,
    sl.expiration_date
FROM software_licenses sl
LEFT JOIN license_allocations la ON la.license_id = sl.id
WHERE sl.is_active = TRUE
GROUP BY sl.id;

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_user_infos_updated_at BEFORE UPDATE ON user_infos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_maintenance_logs_updated_at BEFORE UPDATE ON maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_software_licenses_updated_at BEFORE UPDATE ON software_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION check_license_overallocation()
RETURNS TRIGGER AS $$
DECLARE
    used_seats INTEGER;
    max_seats  INTEGER;
BEGIN
    SELECT total_seats INTO max_seats
    FROM software_licenses
    WHERE id = NEW.license_id
    FOR UPDATE;

    SELECT COUNT(*) INTO used_seats
    FROM license_allocations
    WHERE license_id = NEW.license_id AND returned_at IS NULL;

    IF (used_seats + 1) > max_seats THEN
        RAISE EXCEPTION 'License % has only % seats, % already in use', NEW.license_id, max_seats, used_seats;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_license_before_insert
    BEFORE INSERT ON license_allocations
    FOR EACH ROW EXECUTE FUNCTION check_license_overallocation();
