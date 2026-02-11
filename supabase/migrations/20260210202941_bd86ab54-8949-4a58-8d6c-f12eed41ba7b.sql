
-- Remove duplicate user_roles entry for gestor@seven.com
DELETE FROM user_roles 
WHERE id = 'd8f2ba7d-774b-4f03-9f74-fb8431566cf9';

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_role_id_unique 
UNIQUE (user_id, role_id);
