INSERT INTO roles (role_name) VALUES ('tailor'), ('cutting master')
ON CONFLICT (role_name) DO NOTHING;
