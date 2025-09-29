-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create initial tables will be handled by GORM AutoMigrate
-- This file can be extended with additional setup as needed

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spatial_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spatial_user;
GRANT USAGE ON SCHEMA public TO spatial_user;