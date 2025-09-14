-- Create user upgrade history table
CREATE TABLE IF NOT EXISTS user_upgrade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_plan VARCHAR(20) NOT NULL,
    new_plan VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    upgraded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_upgrade_history_user_id ON user_upgrade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_upgrade_history_upgraded_by ON user_upgrade_history(upgraded_by);
CREATE INDEX IF NOT EXISTS idx_user_upgrade_history_created_at ON user_upgrade_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_upgrade_history_new_plan ON user_upgrade_history(new_plan);

-- Add comments
COMMENT ON TABLE user_upgrade_history IS 'Histórico de upgrades de plano de usuários';
COMMENT ON COLUMN user_upgrade_history.user_id IS 'ID do usuário que teve o plano alterado';
COMMENT ON COLUMN user_upgrade_history.old_plan IS 'Plano anterior do usuário';
COMMENT ON COLUMN user_upgrade_history.new_plan IS 'Novo plano do usuário';
COMMENT ON COLUMN user_upgrade_history.reason IS 'Motivo do upgrade';
COMMENT ON COLUMN user_upgrade_history.effective_date IS 'Data de efetivação do upgrade';
COMMENT ON COLUMN user_upgrade_history.upgraded_by IS 'ID do administrador que fez o upgrade';
