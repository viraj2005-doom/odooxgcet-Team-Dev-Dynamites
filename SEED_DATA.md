# Seed Data Information

The database is automatically seeded with test users when the server starts.

## Seeded Users

### HR User (Admin Role)
- **Email**: `hr@dayflow.com`
- **Password**: `Hr@123456`
- **Employee ID**: `HR001`
- **Role**: HR (maps to admin role)
- **Name**: Sarah Johnson
- **Position**: HR Manager
- **Department**: HR
- **Email Verified**: ✅ Yes (pre-verified for testing)

### Employee User
- **Email**: `employee@dayflow.com`
- **Password**: `Emp@123456`
- **Employee ID**: `EMP001`
- **Role**: Employee
- **Name**: John Doe
- **Position**: Software Developer
- **Department**: Engineering
- **Email Verified**: ✅ Yes (pre-verified for testing)

## Company Information
- **Name**: Dayflow Inc.
- **Code**: DAYF
- **Email**: contact@dayflow.com
- **Phone**: 123-456-7890

## Password Security Rules
Both passwords follow the security requirements:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character (@$!%*?&)

## Usage

You can use these credentials to test the application:

1. **HR Login**:
   - Email: `hr@dayflow.com`
   - Password: `Hr@123456`

2. **Employee Login**:
   - Email: `employee@dayflow.com`
   - Password: `Emp@123456`

Both accounts are pre-verified, so you can login immediately without email verification.

## Notes

- The seed data is only created if the HR user doesn't already exist
- Passwords are hashed using scrypt before storage
- All users belong to the same company (Dayflow Inc.)
- Users are created with active status

