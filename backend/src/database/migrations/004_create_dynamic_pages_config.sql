-- Migration: Create dynamic pages configuration table
-- Description: Table to manage which pages should use dynamic favicon and title

CREATE TABLE IF NOT EXISTS dynamic_pages_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path VARCHAR(255) NOT NULL UNIQUE,
    page_name VARCHAR(255) NOT NULL,
    use_dynamic_title BOOLEAN NOT NULL DEFAULT true,
    use_dynamic_favicon BOOLEAN NOT NULL DEFAULT true,
    custom_title VARCHAR(255),
    custom_favicon_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_config_path ON dynamic_pages_config(page_path);
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_config_active ON dynamic_pages_config(is_active);

-- Insert default configurations for existing pages
INSERT INTO dynamic_pages_config (page_path, page_name, use_dynamic_title, use_dynamic_favicon, description) VALUES
    ('/dashboard', 'Dashboard', true, true, 'Página principal do sistema - usa título e favicon dinâmicos'),
    ('/automation', 'Automation', true, true, 'Página de automações - usa título e favicon dinâmicos'),
    ('/positions', 'Positions', true, true, 'Página de posições - usa título e favicon dinâmicos'),
    ('/backtests', 'Backtests', true, true, 'Página de backtests - usa título e favicon dinâmicos'),
    ('/reports', 'Reports', true, true, 'Página de relatórios - usa título e favicon dinâmicos'),
    ('/profile', 'Profile', false, false, 'Página de perfil - usa título e favicon estáticos'),
    ('/admin', 'Admin Panel', false, false, 'Painel administrativo - usa título e favicon estáticos'),
    ('/admin/menus', 'Menu Management', false, false, 'Gerenciamento de menus - usa título e favicon estáticos'),
    ('/admin/monitoring', 'System Monitoring', false, false, 'Monitoramento do sistema - usa título e favicon estáticos'),
    ('/admin/users', 'User Management', false, false, 'Gerenciamento de usuários - usa título e favicon estáticos'),
    ('/admin/coupons', 'Coupon Management', false, false, 'Gerenciamento de cupons - usa título e favicon estáticos'),
    ('/admin/alerts', 'Alert Management', false, false, 'Gerenciamento de alertas - usa título e favicon estáticos'),
    ('/admin/settings', 'Admin Settings', false, false, 'Configurações administrativas - usa título e favicon estáticos'),
    ('/login', 'Login', false, false, 'Página de login - usa título e favicon estáticos'),
    ('/register', 'Register', false, false, 'Página de registro - usa título e favicon estáticos'),
    ('/', 'Landing Page', false, false, 'Página inicial - usa título e favicon estáticos')
ON CONFLICT (page_path) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dynamic_pages_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_dynamic_pages_config_updated_at
    BEFORE UPDATE ON dynamic_pages_config
    FOR EACH ROW
    EXECUTE FUNCTION update_dynamic_pages_config_updated_at();
