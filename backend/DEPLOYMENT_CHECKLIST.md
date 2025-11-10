# Deployment Checklist for Local Setup

## ✅ Prerequisites

### 1. ClickHouse Database
- [ ] ClickHouse server running on `192.168.203.134:8123`
- [ ] Database `moi` created
- [ ] User `moi` with password `password123` configured

### 2. Python Environment
- [ ] Python 3.9+ installed
- [ ] pip installed and updated

## ✅ Database Setup

### 1. Create Tables
```bash
cat CLICKHOUSE_SETUP.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n
```

### 2. Insert Sample Data
```bash
# Insert entities and correspondences
cat values.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n

# Insert users and roles
cat users.sql | docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi -n
```

### 3. Verify Tables
```bash
docker exec -i clickhouse clickhouse-client \
  --user moi --password password123 --database moi \
  --query "SHOW TABLES"
```

## ✅ Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
Edit `config.py` or create `.env` file:
```env
CLICKHOUSE_HOST=192.168.203.134
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=moi
CLICKHOUSE_USERNAME=moi
CLICKHOUSE_PASSWORD=password123

API_HOST=0.0.0.0
API_PORT=3001

SECRET_KEY=change-this-in-production
SESSION_EXPIRE_DAYS=30
```

### 3. Create Upload Directories
```bash
mkdir -p uploads/attachments uploads/signatures uploads/pdfs
```

### 4. Start Backend Server
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

## ✅ Frontend Setup

### 1. Install Dependencies
```bash
cd ..  # Back to project root
npm install
```

### 2. Configure API Endpoint
Update `src/lib/clickhouseClient.ts` if needed:
```typescript
const API_BASE_URL = 'http://192.168.203.134:3001/api';
```

### 3. Start Frontend
```bash
npm run dev
```

## ✅ Verification

### 1. Backend Health Check
```bash
curl http://192.168.203.134:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "MOI Correspondence API",
  "version": "1.0.0"
}
```

### 2. Test Login
```bash
curl -X POST http://192.168.203.134:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### 3. Test Correspondences
```bash
curl http://192.168.203.134:3001/api/correspondences
```

### 4. Access API Documentation
- Swagger UI: http://192.168.203.134:3001/docs
- ReDoc: http://192.168.203.134:3001/redoc

### 5. Access Frontend
- Open browser: http://localhost:5173 (or your Vite port)
- Login with: username `admin`, password `password123`

## ✅ Complete API Endpoints

### Implemented & Ready
- ✅ Authentication (login, verify session)
- ✅ Users management (list, update)
- ✅ Correspondences (list, get by ID)
- ✅ Entities (list)
- ✅ Templates (list, get, create)
- ✅ Comments (list, create, update, delete)
- ✅ Notifications (list, mark read, count)
- ✅ File Upload (attachments, signatures, PDFs)
- ✅ Statistics (dashboard, by type, by entity, timeline)

### Notes on ClickHouse Limitations
⚠️ **UPDATE/DELETE operations**: ClickHouse uses MergeTree engine which doesn't support traditional UPDATE/DELETE. For production:
- Use `ALTER TABLE ... UPDATE` for updates (mutations)
- Use `ALTER TABLE ... DELETE` for deletions (mutations)
- Or implement soft deletes with a `deleted` flag

## ✅ Security Checklist

### Production Deployment
- [ ] Change `SECRET_KEY` in config
- [ ] Use environment variables for sensitive data
- [ ] Restrict CORS origins to your domain
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up logging and monitoring
- [ ] Change default passwords
- [ ] Configure firewall rules
- [ ] Set up backup strategy

## ✅ Troubleshooting

### ClickHouse Connection Issues
```bash
# Test ClickHouse connection
docker exec clickhouse clickhouse-client --query "SELECT 1"

# Check if database exists
docker exec clickhouse clickhouse-client --query "SHOW DATABASES"
```

### Backend Won't Start
- Check if port 3001 is available
- Verify Python dependencies installed
- Check ClickHouse connectivity
- Review error logs

### Frontend Can't Connect
- Verify backend is running
- Check API_BASE_URL in clickhouseClient.ts
- Check browser console for CORS errors
- Verify network connectivity

## 📚 Documentation

- Backend API docs: http://192.168.203.134:3001/docs
- Full README: backend/README.md
- ClickHouse docs: https://clickhouse.com/docs
- FastAPI docs: https://fastapi.tiangolo.com/
