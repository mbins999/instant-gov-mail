# ClickHouse Setup Guide

## Prerequisites

1. **Install Docker** on your machine
2. **Set up ClickHouse** using Docker:

```bash
docker run -d \
  --name clickhouse-server \
  -p 8123:8123 \
  -p 9000:9000 \
  --ulimit nofile=262144:262144 \
  clickhouse/clickhouse-server
```

## Running the Application Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend Server

```bash
npm run server
```

This will:
- Connect to ClickHouse at `192.168.203.134:8123`
- Create the database and tables automatically
- Start the Express API server on port 3001

### 3. Start the Frontend

In a separate terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Configuration

### ClickHouse Connection

Edit `server/clickhouse/client.ts` if you need to change:
- Host IP: `192.168.203.134`
- Port: `8123`
- Database name: `correspondence_system`
- Username/password

### API Server

The backend API runs on:
- URL: `http://192.168.203.134:3001`
- All API endpoints are prefixed with `/api`

## Data Migration

To migrate existing data from Supabase to ClickHouse:

1. Export data from Supabase dashboard
2. Use the provided migration scripts in `server/migrations/`
3. Run: `npm run migrate`

## Troubleshooting

### ClickHouse Connection Issues

Check if ClickHouse is running:
```bash
docker ps | grep clickhouse
```

View ClickHouse logs:
```bash
docker logs clickhouse-server
```

### API Connection Issues

Ensure the backend server is running and accessible:
```bash
curl http://192.168.203.134:3001/health
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/verify-session` - Verify session token
- `POST /api/users/list` - List all users (admin only)
- `POST /api/users/update` - Update user details
- `GET /api/correspondences` - List all correspondences
- `GET /api/correspondences/:id` - Get single correspondence
- `GET /api/entities` - List all entities
