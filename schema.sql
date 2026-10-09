-- ==============================================================================
-- AI BUS TRACK: ENTERPRISE RELATIONAL DATABASE SCHEMA
-- Compatible with MySQL 8.0+ and PostgreSQL 14+
-- Smart Transportation, School/College Fleet, Live GPS & AI Risk Analysis
-- ==============================================================================

-- Drop tables in reverse dependency order if recreating
DROP TABLE IF EXISTS ai_predictions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS maintenance_records;
DROP TABLE IF EXISTS emergency_incidents;
DROP TABLE IF EXISTS safety_alerts;
DROP TABLE IF EXISTS gps_telemetry;
DROP TABLE IF EXISTS trip_stops;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS route_stops;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS driver_documents;
DROP TABLE IF EXISTS vehicle_documents;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- ------------------------------------------------------------------------------
-- 1. ROLES & RBAC PERMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(32) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(64) NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE user_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(32) NOT NULL,
    module VARCHAR(64) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(role_id, module)
);

-- ------------------------------------------------------------------------------
-- 2. BUS FLEET MANAGEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE buses (
    id VARCHAR(64) PRIMARY KEY,
    reg_number VARCHAR(32) NOT NULL UNIQUE,        -- e.g., UP65 AB 1021
    vehicle_number VARCHAR(32) NOT NULL,           -- Internal fleet number (e.g., BUS-101)
    bus_type VARCHAR(48) NOT NULL,                 -- School Bus, College Bus, Public Transport, Staff Bus, Tourist Bus, Electric Bus, Mini Bus, Luxury Bus
    is_ac BOOLEAN DEFAULT TRUE,                    -- AC vs Non-AC specification
    manufacturer VARCHAR(64) NOT NULL,             -- Tata Motors, Ashok Leyland, Volvo, Eicher, BharatBenz
    model VARCHAR(64) NOT NULL,                    -- Starbus, Viking, 9600, Skyline Pro
    manufacturing_year INT NOT NULL,               -- e.g., 2023
    seating_capacity INT NOT NULL,                 -- e.g., 42
    standing_capacity INT NOT NULL DEFAULT 15,     -- e.g., 15
    fuel_type VARCHAR(32) NOT NULL,                -- Diesel, CNG, Electric, Hybrid
    engine_number VARCHAR(64) NOT NULL,
    chassis_number VARCHAR(64) NOT NULL UNIQUE,
    vehicle_class VARCHAR(48) DEFAULT 'Commercial Heavy Passenger',
    gps_device_id VARCHAR(64) NOT NULL UNIQUE,
    gps_status VARCHAR(24) DEFAULT 'ONLINE',       -- ONLINE, OFFLINE, DEGRADED
    current_lat DECIMAL(10, 7) NOT NULL,
    current_lng DECIMAL(10, 7) NOT NULL,
    current_speed DECIMAL(5, 2) DEFAULT 0.00,      -- km/h
    heading DECIMAL(5, 2) DEFAULT 0.00,            -- degrees
    odometer_km DECIMAL(10, 2) DEFAULT 24500.00,
    last_service_date DATE NOT NULL,
    next_service_date DATE NOT NULL,
    bus_status VARCHAR(32) DEFAULT 'ACTIVE',       -- ACTIVE, ON_ROUTE, MAINTENANCE, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_documents (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    doc_type VARCHAR(48) NOT NULL,                 -- PERMIT, INSURANCE, FITNESS, PUC, REGISTRATION
    doc_number VARCHAR(64) NOT NULL,
    issuing_authority VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(24) DEFAULT 'VALID',            -- VALID, EXPIRING_SOON, EXPIRED
    document_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 3. DRIVER MANAGEMENT & VERIFICATION
-- ------------------------------------------------------------------------------
CREATE TABLE drivers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NULL,
    full_name VARCHAR(100) NOT NULL,
    guardian_name VARCHAR(100) NOT NULL,           -- Father's / Mother's Name
    dob DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    blood_group VARCHAR(8) NOT NULL,               -- Access restricted
    employee_id VARCHAR(32) NOT NULL UNIQUE,
    joining_date DATE NOT NULL,
    experience_years INT NOT NULL DEFAULT 5,
    assigned_bus_id VARCHAR(64) NULL,
    employment_status VARCHAR(32) DEFAULT 'ACTIVE',-- ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED
    safety_score INT DEFAULT 95,                   -- 0 - 100
    risk_level VARCHAR(24) DEFAULT 'LOW',          -- LOW, MEDIUM, HIGH
    aadhaar_verified BOOLEAN DEFAULT TRUE,
    police_verification_status VARCHAR(32) DEFAULT 'VERIFIED', -- VERIFIED, PENDING, FAILED
    medical_fitness_status VARCHAR(32) DEFAULT 'FIT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

CREATE TABLE driver_documents (
    id VARCHAR(64) PRIMARY KEY,
    driver_id VARCHAR(64) NOT NULL,
    doc_type VARCHAR(48) NOT NULL,                 -- DRIVING_LICENCE, POLICE_VERIFICATION, MEDICAL_FITNESS, TRAINING_CERTIFICATE
    licence_number VARCHAR(64) NOT NULL,
    licence_class VARCHAR(64) NOT NULL,            -- HMV (Heavy Motor Vehicle), PSV (Public Service Vehicle), LMV
    issuing_rto VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    verification_status VARCHAR(32) DEFAULT 'VERIFIED',
    document_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 4. ROUTES & STOPS MANAGEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE routes (
    id VARCHAR(64) PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    route_code VARCHAR(32) NOT NULL UNIQUE,
    starting_point VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(6, 2) NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    scheduled_departure_time TIME NOT NULL,
    assigned_bus_id VARCHAR(64) NULL,
    assigned_driver_id VARCHAR(64) NULL,
    route_status VARCHAR(32) DEFAULT 'ACTIVE',     -- ACTIVE, INACTIVE, DIVERTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE route_stops (
    id VARCHAR(64) PRIMARY KEY,
    route_id VARCHAR(64) NOT NULL,
    stop_sequence INT NOT NULL,
    stop_name VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    scheduled_pickup_time TIME NOT NULL,
    scheduled_drop_time TIME NOT NULL,
    geofence_radius_meters INT DEFAULT 80,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 5. TRIPS & LIVE GPS TELEMETRY
-- ------------------------------------------------------------------------------
CREATE TABLE trips (
    id VARCHAR(64) PRIMARY KEY,
    trip_code VARCHAR(32) NOT NULL UNIQUE,
    bus_id VARCHAR(64) NOT NULL,
    driver_id VARCHAR(64) NOT NULL,
    route_id VARCHAR(64) NOT NULL,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    distance_covered_km DECIMAL(6, 2) DEFAULT 0.00,
    average_speed_kmh DECIMAL(5, 2) DEFAULT 0.00,
    maximum_speed_kmh DECIMAL(5, 2) DEFAULT 0.00,
    passenger_count INT DEFAULT 0,
    trip_status VARCHAR(32) DEFAULT 'SCHEDULED',   -- SCHEDULED, STARTED, DELAYED, COMPLETED, CANCELLED, EMERGENCY
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT
);

CREATE TABLE gps_telemetry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    trip_id VARCHAR(64) NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    speed DECIMAL(5, 2) NOT NULL,
    heading DECIMAL(5, 2) DEFAULT 0.00,
    satellite_count INT DEFAULT 12,
    ignition_on BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- 6. SAFETY, ABNORMAL DETECTION & EMERGENCIES (SOS)
-- ------------------------------------------------------------------------------
CREATE TABLE safety_alerts (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    driver_id VARCHAR(64) NOT NULL,
    trip_id VARCHAR(64) NULL,
    alert_type VARCHAR(48) NOT NULL,               -- SPEEDING, HARSH_BRAKING, HARSH_ACCELERATION, ROUTE_DEVIATION, GEOFENCE_BREACH
    severity VARCHAR(24) NOT NULL,                 -- CRITICAL, WARNING, NORMAL
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    speed_recorded DECIMAL(5, 2) NULL,
    deviation_km DECIMAL(5, 2) NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE emergency_incidents (
    id VARCHAR(64) PRIMARY KEY,
    incident_code VARCHAR(32) NOT NULL UNIQUE,     -- e.g., SOS-9821
    bus_id VARCHAR(64) NOT NULL,
    driver_id VARCHAR(64) NOT NULL,
    emergency_type VARCHAR(48) NOT NULL,           -- ACCIDENT, MEDICAL_EMERGENCY, BREAKDOWN, DRIVER_EMERGENCY, PASSENGER_EMERGENCY, ROUTE_BLOCKAGE, GPS_TAMPERING
    severity VARCHAR(24) NOT NULL,                 -- CRITICAL, HIGH, MEDIUM
    location_label VARCHAR(150) NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',           -- ACTIVE, DISPATCHED, UNDER_REVIEW, RESOLVED
    reported_by VARCHAR(64) NOT NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 7. MAINTENANCE & VEHICLE UPKEEP
-- ------------------------------------------------------------------------------
CREATE TABLE maintenance_records (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    service_type VARCHAR(64) NOT NULL,             -- SCHEDULED_INSPECTION, BRAKE_OVERHAUL, ENGINE_TUNING, TIRE_ROTATION, HVAC_SERVICE
    service_date DATE NOT NULL,
    next_service_date DATE NOT NULL,
    odometer_at_service DECIMAL(10, 2) NOT NULL,
    service_center VARCHAR(100) NOT NULL,
    cost_inr DECIMAL(10, 2) NOT NULL,
    remarks TEXT,
    maintenance_status VARCHAR(32) DEFAULT 'COMPLETED', -- DUE, IN_PROGRESS, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 8. NOTIFICATIONS & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    target_role VARCHAR(32) NULL,
    category VARCHAR(48) NOT NULL,                 -- EMERGENCY, DOCUMENT_EXPIRY, MAINTENANCE, SPEEDING, DELAY
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    level VARCHAR(24) NOT NULL,                    -- CRITICAL, WARNING, NORMAL
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(48) NOT NULL,
    action VARCHAR(100) NOT NULL,                  -- e.g., "Updated Driver Profile", "Dispatched Emergency"
    module VARCHAR(48) NOT NULL,                   -- e.g., "DRIVERS", "BUSES", "EMERGENCY"
    ip_address VARCHAR(48) NOT NULL,               -- Masked for privacy (e.g., "192.168.1.***")
    status VARCHAR(24) DEFAULT 'SUCCESS',          -- SUCCESS, FAILED, WARNING
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. AI PREDICTIONS & ROUTE OPTIMIZATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE ai_predictions (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    route_id VARCHAR(64) NOT NULL,
    prediction_type VARCHAR(48) NOT NULL,          -- DELAY_PREDICTION, ROUTE_OPTIMIZATION, RISK_ANALYSIS
    scheduled_time TIMESTAMP NOT NULL,
    predicted_time TIMESTAMP NOT NULL,
    delay_minutes INT DEFAULT 0,
    confidence_score DECIMAL(5, 2) NOT NULL,       -- e.g., 88.50%
    probability_level VARCHAR(24) NOT NULL,        -- HIGH, MEDIUM, LOW
    root_cause VARCHAR(255) NOT NULL,
    suggested_action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- INITIAL SEED DATA FOR DEMO & HACKATHON EVALUATION
-- ------------------------------------------------------------------------------

-- Seed Roles
INSERT INTO roles (id, name, description, level) VALUES
('super_admin', 'Super Admin', 'Unrestricted administrative access to all systems', 10),
('transport_admin', 'Transport Admin', 'Manages buses, drivers, routes, schedules, and operations', 8),
('fleet_manager', 'Fleet Manager', 'Vehicle specs, maintenance logs, fuel tracking, and telemetry', 6),
('dispatcher', 'Dispatcher', 'Trip dispatch, real-time tracking, schedule management', 5),
('driver', 'Driver', 'Assigned trip execution, SOS incident dispatch, turn navigation', 3),
('security_officer', 'Security Officer', 'Driver background review, emergency resolution, safety audits', 5),
('viewer', 'Viewer / Parent', 'Read-only access to live bus tracking and school trip status', 1);

-- Seed Permissions for Transport Admin
INSERT INTO user_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete) VALUES
('perm-ta-buses', 'transport_admin', 'BUSES', TRUE, TRUE, TRUE, TRUE),
('perm-ta-drivers', 'transport_admin', 'DRIVERS', TRUE, TRUE, TRUE, TRUE),
('perm-ta-routes', 'transport_admin', 'ROUTES', TRUE, TRUE, TRUE, TRUE),
('perm-ta-trips', 'transport_admin', 'TRIPS', TRUE, TRUE, TRUE, FALSE),
('perm-ta-tracking', 'transport_admin', 'TRACKING', TRUE, FALSE, FALSE, FALSE),
('perm-ta-emergency', 'transport_admin', 'EMERGENCY', TRUE, TRUE, TRUE, FALSE);

-- Seed Default Admin User (Password: Admin@AI2026! hashed or standard bcrypt)
INSERT INTO users (id, role_id, full_name, email, password_hash, mobile, avatar_url, is_active) VALUES
('usr-admin-01', 'super_admin', 'Gyananand (Super Admin)', 'admin@aibus.in', '$2a$12$7xKev.Y10FmY9e0tYtB2bO9y4f.XgLsqdO7K1RzS7E0s1H6tQyWzG', '+91 98765 43210', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', TRUE),
('usr-ta-01', 'transport_admin', 'Rajesh Verma (Transport Admin)', 'transport@aibus.in', '$2a$12$7xKev.Y10FmY9e0tYtB2bO9y4f.XgLsqdO7K1RzS7E0s1H6tQyWzG', '+91 98765 43211', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', TRUE),
('usr-fleet-01', 'fleet_manager', 'Sunita Patel (Fleet Manager)', 'fleet@aibus.in', '$2a$12$7xKev.Y10FmY9e0tYtB2bO9y4f.XgLsqdO7K1RzS7E0s1H6tQyWzG', '+91 98765 43212', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', TRUE),
('usr-driver-01', 'driver', 'Rahul Sharma (Driver UP65-1021)', 'rahul.driver@aibus.in', '$2a$12$7xKev.Y10FmY9e0tYtB2bO9y4f.XgLsqdO7K1RzS7E0s1H6tQyWzG', '+91 98765 43213', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', TRUE),
('usr-sec-01', 'security_officer', 'Vikram Singh (Security Officer)', 'security@aibus.in', '$2a$12$7xKev.Y10FmY9e0tYtB2bO9y4f.XgLsqdO7K1RzS7E0s1H6tQyWzG', '+91 98765 43214', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', TRUE);

-- Seed Buses with AC / Non-AC, School, College, and Public types
INSERT INTO buses (id, reg_number, vehicle_number, bus_type, is_ac, manufacturer, model, manufacturing_year, seating_capacity, standing_capacity, fuel_type, engine_number, chassis_number, gps_device_id, gps_status, current_lat, current_lng, current_speed, last_service_date, next_service_date, bus_status) VALUES
('bus-001', 'UP65 AB 1021', 'BUS-101', 'School Bus', TRUE, 'Tata Motors', 'Starbus Ultra AC', 2023, 42, 10, 'CNG', 'ENG-TT-88219', 'CHS-UP65-9921', 'GPS-TRK-1021', 'ONLINE', 25.3176, 82.9739, 38.5, '2026-08-15', '2026-11-15', 'ON_ROUTE'),
('bus-002', 'UP65 AB 1022', 'BUS-102', 'College Bus', TRUE, 'Ashok Leyland', 'Viking 222 AC', 2022, 52, 15, 'Diesel', 'ENG-AL-44120', 'CHS-UP65-9922', 'GPS-TRK-1022', 'ONLINE', 25.3340, 82.9873, 44.0, '2026-07-20', '2026-10-20', 'ON_ROUTE'),
('bus-003', 'UP65 AB 1023', 'BUS-103', 'Public Transport Bus', FALSE, 'Eicher', 'Skyline Pro Non-AC', 2021, 48, 20, 'CNG', 'ENG-EI-33211', 'CHS-UP65-9923', 'GPS-TRK-1023', 'ONLINE', 25.2881, 83.0068, 28.0, '2026-09-01', '2026-12-01', 'ACTIVE'),
('bus-004', 'UP65 AB 1024', 'BUS-104', 'School Bus', TRUE, 'BharatBenz', 'School Star AC', 2024, 36, 8, 'Electric', 'ENG-BB-99412', 'CHS-UP65-9924', 'GPS-TRK-1024', 'ONLINE', 25.3520, 82.9200, 52.0, '2026-08-25', '2026-11-25', 'ON_ROUTE'),
('bus-005', 'UP65 AB 1025', 'BUS-105', 'Staff Bus', FALSE, 'Tata Motors', 'CityRide Non-AC', 2020, 40, 12, 'Diesel', 'ENG-TT-11029', 'CHS-UP65-9925', 'GPS-TRK-1025', 'OFFLINE', 25.3170, 82.9700, 0.0, '2026-05-10', '2026-08-10', 'MAINTENANCE'),
('bus-006', 'UP65 AB 1026', 'BUS-106', 'Luxury Bus', TRUE, 'Volvo', '9600 Multi-Axle AC', 2024, 45, 0, 'Diesel', 'ENG-VO-77319', 'CHS-UP65-9926', 'GPS-TRK-1026', 'ONLINE', 26.8467, 80.9462, 65.0, '2026-09-10', '2026-12-10', 'ON_ROUTE');

-- Seed Vehicle Documents
INSERT INTO vehicle_documents (id, bus_id, doc_type, doc_number, issue_date, expiry_date, status) VALUES
('doc-v-01', 'bus-001', 'INSURANCE', 'POL-ICICI-992019', '2025-10-20', '2026-10-20', 'EXPIRING_SOON'),
('doc-v-02', 'bus-001', 'FITNESS', 'FIT-VNS-RTO-4412', '2025-11-01', '2026-11-01', 'VALID'),
('doc-v-03', 'bus-001', 'PUC', 'PUC-UP-882194', '2026-05-15', '2026-11-15', 'VALID'),
('doc-v-04', 'bus-002', 'PERMIT', 'PERM-ST-UP65-102', '2024-04-10', '2029-04-10', 'VALID'),
('doc-v-05', 'bus-005', 'FITNESS', 'FIT-VNS-RTO-3310', '2025-08-01', '2026-08-01', 'EXPIRED');

-- Seed Drivers with Safety Scores and Full Profiles
INSERT INTO drivers (id, user_id, full_name, guardian_name, dob, gender, mobile, email, address, emergency_contact, blood_group, employee_id, joining_date, experience_years, assigned_bus_id, employment_status, safety_score, risk_level, aadhaar_verified, police_verification_status, medical_fitness_status) VALUES
('drv-001', 'usr-driver-01', 'Rahul Sharma', 'Shri Rameshwar Sharma', '1987-04-12', 'Male', '+91 98765 11001', 'rahul.sharma@aibus.in', 'Plot 42, Shivpur, Varanasi, UP - 221002', '+91 98765 11099', 'B+', 'EMP-DRV-101', '2021-03-15', 9, 'bus-001', 'ACTIVE', 92, 'LOW', TRUE, 'VERIFIED', 'FIT'),
('drv-002', NULL, 'Manoj Kumar Maurya', 'Shri Ram Surat Maurya', '1984-09-22', 'Male', '+91 98765 11002', 'manoj.maurya@aibus.in', 'House 18, Sigra, Varanasi, UP - 221010', '+91 98765 11098', 'O+', 'EMP-DRV-102', '2020-07-01', 12, 'bus-002', 'ACTIVE', 88, 'LOW', TRUE, 'VERIFIED', 'FIT'),
('drv-003', NULL, 'Deepak Singh', 'Shri Virendra Singh', '1992-11-05', 'Male', '+91 98765 11003', 'deepak.singh@aibus.in', 'Lane 4, Lanka, Varanasi, UP - 221005', '+91 98765 11097', 'A+', 'EMP-DRV-103', '2022-01-10', 6, 'bus-003', 'ACTIVE', 74, 'MEDIUM', TRUE, 'VERIFIED', 'FIT'),
('drv-004', NULL, 'Amit Yadav', 'Shri Jagdish Yadav', '1989-02-18', 'Male', '+91 98765 11004', 'amit.yadav@aibus.in', 'B-12, Cantonment, Varanasi, UP - 221002', '+91 98765 11096', 'AB+', 'EMP-DRV-104', '2023-04-15', 7, 'bus-004', 'ACTIVE', 61, 'HIGH', TRUE, 'PENDING', 'FIT'),
('drv-005', NULL, 'Satish Chandra Pandey', 'Shri K. N. Pandey', '1980-06-30', 'Male', '+91 98765 11005', 'satish.pandey@aibus.in', 'H.No 88, Alambagh, Lucknow, UP - 226005', '+91 98765 11095', 'O-', 'EMP-DRV-105', '2019-11-20', 16, 'bus-006', 'ACTIVE', 96, 'LOW', TRUE, 'VERIFIED', 'FIT');

-- Seed Driver Documents (Licences)
INSERT INTO driver_documents (id, driver_id, doc_type, licence_number, licence_class, issuing_rto, issue_date, expiry_date, verification_status) VALUES
('doc-d-01', 'drv-001', 'DRIVING_LICENCE', 'UP65-20120038491', 'HMV (Heavy Transport Commercial)', 'RTO Varanasi', '2015-05-10', '2027-05-10', 'VERIFIED'),
('doc-d-02', 'drv-002', 'DRIVING_LICENCE', 'UP65-20090019283', 'HMV + PSV Badge', 'RTO Varanasi', '2012-08-14', '2026-10-20', 'EXPIRING_SOON'),
('doc-d-03', 'drv-003', 'DRIVING_LICENCE', 'UP65-20180092817', 'HMV Transport', 'RTO Varanasi', '2018-02-19', '2028-02-19', 'VERIFIED'),
('doc-d-04', 'drv-004', 'DRIVING_LICENCE', 'UP65-20160081726', 'LMV / PSV Heavy Commercial', 'RTO Varanasi', '2016-11-04', '2026-10-15', 'EXPIRING_SOON');

-- Seed Routes
INSERT INTO routes (id, route_name, route_code, starting_point, destination, distance_km, estimated_duration_minutes, scheduled_departure_time, assigned_bus_id, assigned_driver_id, route_status) VALUES
('rt-001', 'DPS Varanasi Campus Express (School)', 'SCH-RT-01', 'Shivpur Bus Terminal', 'Delhi Public School Campus', 18.40, 42, '07:30:00', 'bus-001', 'drv-001', 'ACTIVE'),
('rt-002', 'BHU University South Route (College)', 'COL-RT-02', 'Varanasi Cantt Station', 'BHU Main Gate Campus', 14.20, 35, '08:00:00', 'bus-002', 'drv-002', 'ACTIVE'),
('rt-003', 'Varanasi Ghats & Heritage Line', 'PUB-RT-03', 'Sarnath Depot', 'Assi Ghat Waterfront', 22.50, 55, '08:30:00', 'bus-003', 'drv-003', 'ACTIVE'),
('rt-004', 'St. Johns School West Corridor', 'SCH-RT-04', 'Babaspur Crossing', 'St. Johns School Gate 2', 15.90, 34, '07:45:00', 'bus-004', 'drv-004', 'DIVERTED');

-- Seed Emergency SOS Incidents
INSERT INTO emergency_incidents (id, incident_code, bus_id, driver_id, emergency_type, severity, location_label, lat, lng, description, status, reported_by) VALUES
('sos-01', 'SOS-2026-01', 'bus-004', 'drv-004', 'UNAUTHORIZED_ROUTE', 'CRITICAL', 'Ring Road Phase-2, Near Harhua Bypass', 25.3520, 82.9200, 'Bus is 1.8 km off-route from designated corridor. AI Geofence breach triggered.', 'ACTIVE', 'AI Automated System'),
('sos-02', 'SOS-2026-02', 'bus-002', 'drv-002', 'VEHICLE_BREAKDOWN', 'HIGH', 'Sigra Crossing, Near Stadium Gate', 25.3210, 82.9810, 'Radiator hose pressure drop reported by driver. Replacement coach dispatched.', 'DISPATCHED', 'Driver Mobile SOS'),
('sos-03', 'SOS-2026-03', 'bus-005', 'drv-005', 'MEDICAL_EMERGENCY', 'MEDIUM', 'Alambagh Terminal Bay 4', 26.7988, 80.9008, 'Passenger feeling sudden dizziness; terminal paramedic station alerted.', 'RESOLVED', 'Terminal Supervisor');

-- Seed Maintenance
INSERT INTO maintenance_records (id, bus_id, service_type, service_date, next_service_date, odometer_at_service, service_center, cost_inr, remarks, maintenance_status) VALUES
('maint-01', 'bus-001', 'SCHEDULED_INSPECTION', '2026-08-15', '2026-11-15', 24500.00, 'Tata Authorized Service Hub, Shivpur', 4850.00, 'Oil filter and brake pad inspection completed. Air conditioning coolant topped up.', 'COMPLETED'),
('maint-02', 'bus-002', 'BRAKE_OVERHAUL', '2026-07-20', '2026-10-20', 38200.00, 'Ashok Leyland Service Care, Ramnagar', 12400.00, 'ABS sensor recalibration and pneumatic brake liners replaced.', 'COMPLETED'),
('maint-03', 'bus-005', 'ENGINE_TUNING', '2026-10-05', '2026-10-12', 64100.00, 'Varanasi Central Fleet Workshop', 18900.00, 'Scheduled injector overhaul. Vehicle temporarily decommissioned.', 'IN_PROGRESS');

-- Seed Audit Logs
INSERT INTO audit_logs (id, user_name, user_role, action, module, ip_address, status, details) VALUES
('aud-01', 'Gyananand', 'Super Admin', 'Approved Driver Document Verification', 'DRIVERS', '192.168.1.***', 'SUCCESS', 'Verified HMV Licence for Rahul Sharma (EMP-DRV-101)'),
('aud-02', 'Rajesh Verma', 'Transport Admin', 'Updated Route Corridor', 'ROUTES', '192.168.1.***', 'SUCCESS', 'Applied AI recommended detour on Route SCH-RT-01 due to road works'),
('aud-03', 'Vikram Singh', 'Security Officer', 'Acknowledged Route Deviation Alert', 'EMERGENCY', '192.168.1.***', 'SUCCESS', 'Contacted Driver Amit Yadav regarding 1.8km off-route alert on bus UP65 AB 1024');

-- Seed AI Predictions
INSERT INTO ai_predictions (id, bus_id, route_id, prediction_type, scheduled_time, predicted_time, delay_minutes, confidence_score, probability_level, root_cause, suggested_action) VALUES
('pred-01', 'bus-001', 'rt-001', 'DELAY_PREDICTION', '2026-10-08 08:30:00', '2026-10-08 08:42:00', 12, 88.50, 'HIGH', 'Heavy traffic detected on Cantonment Ring Road junction.', 'Notify parents and dispatcher; suggest bypass corridor.');
