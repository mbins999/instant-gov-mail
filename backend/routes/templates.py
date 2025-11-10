from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional, List
import uuid
from models import TemplateBase, TemplateCreate
from database import get_client

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("")
async def list_templates(
    x_session_token: Optional[str] = Header(None),
    category: Optional[str] = None,
    type: Optional[str] = None
):
    """List all active templates"""
    client = get_client()
    
    try:
        query = """
            SELECT *
            FROM correspondence_templates
            WHERE is_active = 1
        """
        params = {}
        
        if category:
            query += " AND category = %(category)s"
            params["category"] = category
        
        if type:
            query += " AND type = %(type)s"
            params["type"] = type
        
        query += " ORDER BY usage_count DESC, created_at DESC"
        
        result = client.query(query, parameters=params if params else None)
        
        templates = []
        for row in result.result_rows:
            templates.append({
                "id": row[0],
                "name": row[1],
                "content_template": row[2],
                "subject_template": row[3],
                "greeting": row[4],
                "category": row[5],
                "type": row[6],
                "entity_id": row[7],
                "variables": row[8],
                "is_active": row[9] == 1,
                "is_public": row[10] == 1,
                "usage_count": row[11],
                "created_by": row[12],
                "updated_by": row[13],
                "created_at": row[14],
                "updated_at": row[15]
            })
        
        return templates
        
    except Exception as e:
        print(f"List templates error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch templates"
        )

@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get a single template by ID"""
    client = get_client()
    
    try:
        result = client.query(
            """
            SELECT *
            FROM correspondence_templates
            WHERE id = %(id)s
            LIMIT 1
            """,
            parameters={"id": template_id}
        )
        
        if not result.result_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        row = result.result_rows[0]
        
        return {
            "id": row[0],
            "name": row[1],
            "content_template": row[2],
            "subject_template": row[3],
            "greeting": row[4],
            "category": row[5],
            "type": row[6],
            "entity_id": row[7],
            "variables": row[8],
            "is_active": row[9] == 1,
            "is_public": row[10] == 1,
            "usage_count": row[11],
            "created_by": row[12],
            "updated_by": row[13],
            "created_at": row[14],
            "updated_at": row[15]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get template error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch template"
        )

@router.post("")
async def create_template(
    template: TemplateCreate,
    x_session_token: Optional[str] = Header(None)
):
    """Create a new template"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        # Get user_id from session
        session_result = client.query(
            """
            SELECT user_id
            FROM sessions
            WHERE token = %(token)s AND expires_at > now()
            LIMIT 1
            """,
            parameters={"token": x_session_token}
        )
        
        if not session_result.result_rows:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session"
            )
        
        user_id = session_result.result_rows[0][0]
        template_id = str(uuid.uuid4())
        
        client.command(
            """
            INSERT INTO correspondence_templates (
                id, name, subject_template, content_template, greeting,
                category, type, entity_id, variables, is_active, is_public,
                created_by, created_at, updated_at
            ) VALUES (
                %(id)s, %(name)s, %(subject_template)s, %(content_template)s, %(greeting)s,
                %(category)s, %(type)s, NULL, '[]', 1, %(is_public)s,
                %(created_by)s, now(), now()
            )
            """,
            parameters={
                "id": template_id,
                "name": template.name,
                "subject_template": template.subject_template,
                "content_template": template.content_template,
                "greeting": template.greeting,
                "category": template.category,
                "type": template.type,
                "is_public": 0,
                "created_by": user_id
            }
        )
        
        return {"id": template_id, "message": "Template created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create template error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template"
        )
