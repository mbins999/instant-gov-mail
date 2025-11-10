from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
import bcrypt
import uuid
from models import LoginRequest, LoginResponse, SessionVerifyRequest
from database import get_client
from config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Authenticate user and create session"""
    client = get_client()
    
    try:
        # Get user by username
        result = client.query(
            """
            SELECT id, username, password_hash, full_name, entity_id, entity_name
            FROM users
            WHERE username = {username:String}
            LIMIT 1
            """,
            parameters={"username": credentials.username}
        )
        
        if not result.result_rows:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        user = result.result_rows[0]
        user_id, username, password_hash, full_name, entity_id, entity_name = user
        
        # Verify password
        if not bcrypt.checkpw(credentials.password.encode('utf-8'), password_hash.encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Get user role
        role_result = client.query(
            """
            SELECT role
            FROM user_roles
            WHERE user_id = {user_id:UInt64}
            LIMIT 1
            """,
            parameters={"user_id": user_id}
        )
        
        role = role_result.result_rows[0][0] if role_result.result_rows else "user"
        
        # Create session
        session_id = str(uuid.uuid4())
        session_token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(days=settings.SESSION_EXPIRE_DAYS)
        
        client.command(
            """
            INSERT INTO sessions (id, user_id, token, expires_at, created_at)
            VALUES ({id:String}, {user_id:UInt64}, {token:String}, {expires_at:DateTime}, now())
            """,
            parameters={
                "id": session_id,
                "user_id": user_id,
                "token": session_token,
                "expires_at": expires_at
            }
        )
        
        return LoginResponse(
            access_token=session_token,
            user={
                "id": user_id,
                "username": username,
                "full_name": full_name,
                "entity_id": entity_id,
                "entity_name": entity_name,
                "role": role
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/verify-session")
async def verify_session(request: SessionVerifyRequest):
    """Verify if session token is valid"""
    client = get_client()
    
    try:
        result = client.query(
            """
            SELECT s.user_id, s.expires_at, u.username, u.full_name, u.entity_id, u.entity_name
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = {token:String}
            LIMIT 1
            """,
            parameters={"token": request.sessionToken}
        )
        
        if not result.result_rows:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session"
            )
        
        session = result.result_rows[0]
        user_id, expires_at, username, full_name, entity_id, entity_name = session
        
        if expires_at < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        
        # Get user role
        role_result = client.query(
            """
            SELECT role
            FROM user_roles
            WHERE user_id = {user_id:UInt64}
            LIMIT 1
            """,
            parameters={"user_id": user_id}
        )
        
        role = role_result.result_rows[0][0] if role_result.result_rows else "user"
        
        return {
            "valid": True,
            "user": {
                "id": user_id,
                "username": username,
                "full_name": full_name,
                "entity_id": entity_id,
                "entity_name": entity_name,
                "role": role
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Session verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session verification failed"
        )
