-- ============================================================================
-- Migration Script: Add Time Fields to EntrepreneurCourses Table
-- Database: FICCPlatform (SQL Server)
-- Date: 2026-04-11 09:32 UTC
-- Purpose: Add StartTime, EndTime, FormCloseDateTime, ConfirmationDeadlineDateTime
-- ============================================================================

-- Step 1: Backup (Optional - for safety)
-- BACKUP DATABASE [FICCPlatform] TO DISK = 'C:\Backups\FICCPlatform_PRE_MIGRATION.bak'

-- Step 2: Add new columns to EntrepreneurCourses table
ALTER TABLE [dbo].[EntrepreneurCourses]
ADD 
    [StartTime] TIME NULL,
    [EndTime] TIME NULL,
    [FormCloseDateTime] DATETIME2 NULL,
    [ConfirmationDeadlineDateTime] DATETIME2 NULL;

-- Step 3: Verify the new columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'EntrepreneurCourses' 
  AND COLUMN_NAME IN ('StartTime', 'EndTime', 'FormCloseDateTime', 'ConfirmationDeadlineDateTime')
ORDER BY ORDINAL_POSITION;

-- Step 4: Check all columns in the table
SELECT 
    COLUMN_NAME, 
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'EntrepreneurCourses'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- Migration Complete!
-- New Columns:
-- - StartTime (TIME, NULL)
-- - EndTime (TIME, NULL)
-- - FormCloseDateTime (DATETIME2, NULL)
-- - ConfirmationDeadlineDateTime (DATETIME2, NULL)
-- ============================================================================
