from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from database import get_client
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/entities", tags=["Entities"])

class EntityCreate(BaseModel):
    name: str
    type: str

class EntityUpdate(BaseModel):
    name: str
    type: str

async def verify_admin_session(session_token: Optional[str]):
    """Verify admin session"""
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token provided"
        )
    
    client = get_client()
    result = client.query(
        """
        SELECT u.id, ur.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE s.token = %(token)s AND s.expires_at > now()
        """,
        parameters={"token": session_token}
    )
    
    if not result.result_rows or len(result.result_rows) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    role = result.result_rows[0][1] if len(result.result_rows[0]) > 1 else None
    if role not in ['admin', 'moderator']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Moderator access required"
        )

@router.get("")
async def list_entities():
    """List all entities"""
    client = get_client()
    
    try:
        result = client.query(
            """
            SELECT DISTINCT id, name, type, created_at
            FROM entities
            ORDER BY name ASC
            """
        )
        
        entities = []
        seen_ids = set()
        for row in result.result_rows:
            entity_id = row[0]
            if entity_id not in seen_ids:
                seen_ids.add(entity_id)
                entities.append({
                    "id": entity_id,
                    "name": row[1],
                    "type": row[2],
                    "created_at": row[3]
                })
        
        return entities
        
    except Exception as e:
        print(f"List entities error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch entities"
        )

@router.post("/create")
async def create_entity(
    entity: EntityCreate,
    x_session_token: Optional[str] = Header(None)
):
    """Create a new entity (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access
        await verify_admin_session(x_session_token)
        
        # Check if entity name already exists
        check_result = client.query(
            """
            SELECT COUNT(*) as count
            FROM entities
            WHERE name = %(name)s
            """,
            parameters={"name": entity.name}
        )
        
        if check_result.result_rows[0][0] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity with this name already exists"
            )
        
        # Generate UUID for entity
        entity_id = str(uuid.uuid4())
        
        # Insert new entity
        client.command(
            """
            INSERT INTO entities (id, name, type, created_at)
            VALUES (%(id)s, %(name)s, %(type)s, now())
            """,
            parameters={
                "id": entity_id,
                "name": entity.name,
                "type": entity.type
            }
        )
        
        return {"message": "تم إنشاء الجهة بنجاح", "id": entity_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create entity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create entity: {str(e)}"
        )

@router.put("/update/{entity_id}")
async def update_entity(
    entity_id: str,
    entity: EntityUpdate,
    x_session_token: Optional[str] = Header(None)
):
    """Update an entity (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access
        await verify_admin_session(x_session_token)
        
        # Check if entity exists
        check_result = client.query(
            """
            SELECT COUNT(*) as count
            FROM entities
            WHERE id = %(id)s
            """,
            parameters={"id": entity_id}
        )
        
        if check_result.result_rows[0][0] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        # Update entity
        client.command(
            """
            ALTER TABLE entities UPDATE 
                name = %(name)s,
                type = %(type)s
            WHERE id = %(id)s
            """,
            parameters={
                "id": entity_id,
                "name": entity.name,
                "type": entity.type
            }
        )
        
        return {"message": "تم تحديث الجهة بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update entity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update entity: {str(e)}"
        )

@router.delete("/delete/{entity_id}")
async def delete_entity(
    entity_id: str,
    x_session_token: Optional[str] = Header(None)
):
    """Delete an entity (admin only)"""
    client = get_client()
    
    try:
        # Verify admin access
        await verify_admin_session(x_session_token)
        
        # Check if entity is being used by users
        users_check = client.query(
            """
            SELECT COUNT(*) as count
            FROM users
            WHERE entity_id = %(entity_id)s
            """,
            parameters={"entity_id": entity_id}
        )
        
        if users_check.result_rows[0][0] > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لا يمكن حذف جهة مرتبطة بمستخدمين"
            )
        
        # Delete entity
        client.command(
            """
            ALTER TABLE entities DELETE WHERE id = %(entity_id)s
            """,
            parameters={"entity_id": entity_id}
        )
        
        return {"message": "تم حذف الجهة بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete entity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete entity: {str(e)}"
        )
