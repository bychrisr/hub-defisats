-- Create database and user
CREATE USER hubdefisats WITH PASSWORD 'hubdefisats_dev_password';
CREATE DATABASE hubdefisats OWNER hubdefisats;
GRANT ALL PRIVILEGES ON DATABASE hubdefisats TO hubdefisats;
