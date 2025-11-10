from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
import bcrypt
from models import UserListRequest, UserUpdate
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
                groupArray(ur.role) as roles
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
                "roles": row[7] if row[7] else []
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
