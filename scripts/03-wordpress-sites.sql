-- WordPress Sites Table
CREATE TABLE IF NOT EXISTS wordpress_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_url VARCHAR(255) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255),
    wordpress_version VARCHAR(50),
    access_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_url ON wordpress_sites(site_url);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_token ON wordpress_sites(access_token);
CREATE INDEX IF NOT EXISTS idx_wordpress_sites_active ON wordpress_sites(is_active);

-- Add wordpress_site_id to bots table if it doesn't exist
ALTER TABLE bots ADD COLUMN IF NOT EXISTS wordpress_site_id UUID REFERENCES wordpress_sites(id) ON DELETE CASCADE;

-- Create index for wordpress_site_id
CREATE INDEX IF NOT EXISTS idx_bots_wordpress_site_id ON bots(wordpress_site_id);
