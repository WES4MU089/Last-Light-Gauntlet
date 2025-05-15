-- Step 1: Switch to Your Database
USE SotS-DB; 
GO

-- Step 2: Create SQL Server Login for DBAdmin
CREATE LOGIN DBAdmin WITH PASSWORD = 'B@l3ri0n2025Winter', CHECK_POLICY = ON;
GO

-- Step 3: Create Database User for DBAdmin
CREATE USER DBAdmin FOR LOGIN DBAdmin;
GO

-- Step 4: Grant Read & Write Permissions to the Entire Database
ALTER ROLE db_datareader ADD MEMBER DBAdmin;
ALTER ROLE db_datawriter ADD MEMBER DBAdmin;
GO

-- Step 5: Grant Execute Permission (for stored procedures & functions)
GRANT EXECUTE TO DBAdmin;
GO

-- Step 6: (Optional) Allow DBAdmin to Manage Users (Only if Required)
-- GRANT ALTER ANY USER TO DBAdmin;
-- GRANT ALTER ANY ROLE TO DBAdmin;
-- GO

-- Step 7: (Optional - Not Recommended) Grant Full Control Over the Database
-- ALTER ROLE db_owner ADD MEMBER DBAdmin; 
-- GO

-- Step 8: Verify User Permissions (Run this to check)
SELECT pr.name AS RoleName, pe.state_desc, pe.permission_name
FROM sys.database_permissions pe
JOIN sys.database_principals pr ON pe.grantee_principal_id = pr.principal_id
WHERE pr.name = 'DBAdmin';
GO
