# Teamly Backend API

Backend API for Teamly app with email OTP authentication.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file with your actual credentials:
- PostgreSQL database credentials
- Email service credentials (Gmail recommended)
- JWT secret key

### 3. Setup Database
1. Create PostgreSQL database:
```sql
CREATE DATABASE teamly_db;
```

2. Run the SQL script:
```bash
psql -U postgres -d teamly_db -f database.sql
```

### 4. Email Configuration (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `.env` file

### 5. Run the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Health Check
```
GET /health
```

## Security Features
- Rate limiting on OTP requests (3 requests per 15 minutes)
- OTP expires in 10 minutes
- JWT tokens for authenticated sessions
- CORS enabled for React Native app

## Project Structure
```
teamly_backend/
├── src/
│   ├── config/          # Database and email configuration
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── utils/           # Helper functions
├── .env                 # Environment variables
├── server.js            # Entry point
└── database.sql         # Database schema
```
