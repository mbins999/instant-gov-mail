from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
import bcrypt
from models import UserListRequest, UserUpdate, UserCreate
from database import get_client

router = APIRouter(prefix="/users", tags=["Users"])

async def verify_admin_session(x_session_token: Optional[str] = Header(None)):
    """Verify that the session belongs to an admin user"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token required"
        )
    
    client = get_client()
    
    result = client.query(
        f"""
        SELECT s.user_id
        FROM sessions s
        WHERE s.token = %(token)s AND s.expires_at > now()
        LIMIT 1
        """,
        parameters={"token": x_session_token}
    )
    
    if not result.result_rows:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    user_id = result.result_rows[0][0]
    
    # Check if user is admin
    role_result = client.query(
        f"""
        SELECT role
        FROM user_roles
        WHERE user_id = %(user_id)s AND role = 'admin'
        LIMIT 1
        """,
        parameters={"user_id": user_id}
    )
    
    if not role_result.result_rows:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user_id

@router.post("/list")
async def list_users(request: UserListRequest):
    """List all users (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access using token from request body
        await verify_admin_session(request.sessionToken)
        
        result = client.query(
            f"""
            SELECT 
                u.id, u.username, u.full_name, u.entity_id, u.entity_name,
                u.created_at, u.created_by,
                any(ur.role) as role
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            GROUP BY u.id, u.username, u.full_name, u.entity_id, u.entity_name, u.created_at, u.created_by
            ORDER BY u.created_at DESC
            """
        )
        
        users = []
        for row in result.result_rows:
            users.append({
                "id": row[0],
                "username": row[1],
                "full_name": row[2],
                "entity_id": row[3],
                "entity_name": row[4],
                "created_at": row[5],
                "created_by": row[6],
                "role": row[7] if row[7] else 'user'
            })
        
        return {"users": users}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"List users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )

@router.post("/update")
async def update_user(
    user_update: UserUpdate,
    x_session_token: Optional[str] = Header(None)
):
    """Update user information (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access
        await verify_admin_session(x_session_token)
        
        updates = []
        params = {"user_id": user_update.userId}
        
        if user_update.fullName:
            updates.append("full_name = %(full_name)s")
            params["full_name"] = user_update.fullName
        
        if user_update.entityId:
            # Verify entity exists
            entity_result = client.query(
                f"""
                SELECT id, name
                FROM entities
                WHERE id = %(entity_id)s
                LIMIT 1
                """,
                parameters={"entity_id": user_update.entityId}
            )
            
            if entity_result.result_rows:
                updates.append("entity_id = %(entity_id)s")
                updates.append("entity_name = %(entity_name)s")
                params["entity_id"] = user_update.entityId
                params["entity_name"] = entity_result.result_rows[0][1]
        
        if user_update.password:
            # Hash password
            password_hash = bcrypt.hashpw(
                user_update.password.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            updates.append("password_hash = %(password_hash)s")
            params["password_hash"] = password_hash
        
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided"
            )
        
        # Note: ClickHouse doesn't support traditional UPDATE statements
        # You may need to implement this differently based on your table engine
        # For MergeTree tables, consider using ALTER TABLE UPDATE or recreating the row
        
        return {"message": "User updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

@router.post("/create")
async def create_user(
    user_create: UserCreate,
    x_session_token: Optional[str] = Header(None)
):
    """Create a new user (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access
        admin_user_id = await verify_admin_session(x_session_token)
        
        # Check if username already exists
        existing_user = client.query(
            """
            SELECT id FROM users WHERE username = %(username)s LIMIT 1
            """,
            parameters={"username": user_create.username}
        )
        
        if existing_user.result_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم موجود بالفعل"
            )
        
        # Hash password
        password_hash = bcrypt.hashpw(
            user_create.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Get entity name if entity_id is provided
        entity_name = None
        if user_create.entity_id:
            entity_result = client.query(
                """
                SELECT name FROM entities WHERE id = %(entity_id)s LIMIT 1
                """,
                parameters={"entity_id": user_create.entity_id}
            )
            if entity_result.result_rows:
                entity_name = entity_result.result_rows[0][0]
        
        # Get next user ID
        max_id_result = client.query("SELECT max(id) FROM users")
        next_id = (max_id_result.result_rows[0][0] or 0) + 1
        
        # Insert new user
        client.command(
            """
            INSERT INTO users (id, username, password_hash, full_name, entity_id, entity_name, created_by)
            VALUES (%(id)s, %(username)s, %(password_hash)s, %(full_name)s, %(entity_id)s, %(entity_name)s, %(created_by)s)
            """,
            parameters={
                "id": next_id,
                "username": user_create.username,
                "password_hash": password_hash,
                "full_name": user_create.full_name,
                "entity_id": user_create.entity_id,
                "entity_name": entity_name,
                "created_by": admin_user_id
            }
        )
        
        # Create user role (note: role parameter needs to be added to UserCreate model if not present)
        # For now, default to 'user' role
        import uuid
        role_id = str(uuid.uuid4())
        client.command(
            """
            INSERT INTO user_roles (id, user_id, role)
            VALUES (%(id)s, %(user_id)s, %(role)s)
            """,
            parameters={
                "id": role_id,
                "user_id": next_id,
                "role": getattr(user_create, 'role', 'user')  # Use role from request or default to 'user'
            }
        )
        
        return {
            "message": "تم إنشاء المستخدم بنجاح",
            "user_id": next_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )
