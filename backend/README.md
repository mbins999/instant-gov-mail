# MOI Correspondence Management - Python Backend

FastAPI backend for the MOI Correspondence Management System with ClickHouse database.

## Features

- ✅ User authentication with bcrypt password hashing
- ✅ Session management
- ✅ CRUD operations for correspondences
- ✅ User and entity management
- ✅ Admin role-based access control
- ✅ RESTful API endpoints
- ✅ Automatic API documentation (Swagger/OpenAPI)

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `config.py` or create a `.env` file:

```env
CLICKHOUSE_HOST=192.168.203.134
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=moi
CLICKHOUSE_USERNAME=moi
CLICKHOUSE_PASSWORD=password123

API_HOST=0.0.0.0
API_PORT=3001

SECRET_KEY=your-secret-key-change-in-production
SESSION_EXPIRE_DAYS=30
```

### 3. Initialize Database

Make sure your ClickHouse database is running and execute the setup scripts:

```bash
# Create tables
cat CLICKHOUSE_SETUP.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n

# Insert sample data
cat values.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n

# Insert users
cat users.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n
```

### 4. Run the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-session` - Verify session token

### Users
- `POST /api/users/list` - List all users (admin only)
- `POST /api/users/update` - Update user (admin only)

### Correspondences
- `GET /api/correspondences` - List all correspondences
- `GET /api/correspondences/{id}` - Get correspondence by ID

### Entities
- `GET /api/entities` - List all entities

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/{id}` - Get template by ID
- `POST /api/templates` - Create new template

### Comments
- `GET /api/comments/correspondence/{id}` - List comments for correspondence
- `POST /api/comments` - Create new comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### Notifications
- `GET /api/notifications` - List user notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/{id}` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

### File Upload
- `POST /api/upload/attachment` - Upload attachment file
- `POST /api/upload/signature` - Upload signature image
- `POST /api/upload/pdf` - Upload PDF document

### Statistics
- `GET /api/statistics/dashboard` - Get dashboard statistics
- `GET /api/statistics/correspondences/by-type` - Get counts by type
- `GET /api/statistics/correspondences/by-entity` - Get counts by entity
- `GET /api/statistics/correspondences/timeline` - Get timeline data

### System
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## API Documentation

Once the server is running, visit:
- Swagger UI: http://192.168.203.134:3001/docs
- ReDoc: http://192.168.203.134:3001/redoc

## Testing

### Login Test
```bash
curl -X POST http://192.168.203.134:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### List Correspondences
```bash
curl http://192.168.203.134:3001/api/correspondences
```

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── database.py          # ClickHouse connection
├── models.py            # Pydantic models
├── requirements.txt     # Python dependencies
├── routes/
│   ├── auth.py         # Authentication endpoints
│   ├── users.py        # User management endpoints
│   ├── correspondences.py  # Correspondence endpoints
│   └── entities.py     # Entity endpoints
└── README.md           # This file
```

## Security Notes

⚠️ **Important for Production:**

1. Change `SECRET_KEY` in config.py
2. Use environment variables instead of hardcoded credentials
3. Restrict CORS origins to your frontend domain
4. Enable HTTPS/TLS
5. Implement rate limiting
6. Add input validation and sanitization
7. Set up proper logging and monitoring

## Default Test Credentials

- **Username:** admin
- **Password:** password123
- **Role:** admin

All test users have the same password: `password123`
