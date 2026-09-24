-- Create the application role
CREATE ROLE p26_app WITH LOGIN PASSWORD 'P26_Ecommerce_2026';

GRANT ALL PRIVILEGES ON DATABASE p26_ecommerce TO p26_app;
