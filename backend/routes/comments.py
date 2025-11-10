from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional, List
from pydantic import BaseModel
import uuid
from database import get_client

router = APIRouter(prefix="/comments", tags=["Comments"])

class CommentCreate(BaseModel):
    correspondence_id: str
    comment: str
    is_internal: bool = True
    parent_comment_id: Optional[str] = None
    mentioned_users: List[int] = []
    attachments: List[str] = []

class CommentUpdate(BaseModel):
    comment: str

@router.get("/correspondence/{correspondence_id}")
async def list_comments(
    correspondence_id: str,
    x_session_token: Optional[str] = Header(None)
):
    """List all comments for a correspondence"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query(
            """
            SELECT *
            FROM correspondence_comments
            WHERE correspondence_id = %(correspondence_id)s
            ORDER BY created_at ASC
            """,
            parameters={"correspondence_id": correspondence_id}
        )
        
        comments = []
        for row in result.result_rows:
            comments.append({
                "id": row[0],
                "correspondence_id": row[1],
                "user_id": row[2],
                "comment": row[3],
                "is_internal": row[4] == 1,
                "parent_comment_id": row[5],
                "mentioned_users": row[6] if row[6] else [],
                "attachments": row[7] if row[7] else [],
                "is_edited": row[8] == 1,
                "created_at": row[9],
                "updated_at": row[10]
            })
        
        return comments
        
    except Exception as e:
        print(f"List comments error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch comments"
        )

@router.post("")
async def create_comment(
    comment_data: CommentCreate,
    x_session_token: Optional[str] = Header(None)
):
    """Create a new comment"""
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
        comment_id = str(uuid.uuid4())
        
        client.command(
            """
            INSERT INTO correspondence_comments (
                id, correspondence_id, user_id, comment, is_internal,
                parent_comment_id, mentioned_users, attachments,
                created_at, updated_at
            ) VALUES (
                %(id)s, %(correspondence_id)s, %(user_id)s, %(comment)s, %(is_internal)s,
                %(parent_comment_id)s, %(mentioned_users)s, %(attachments)s,
                now(), now()
            )
            """,
            parameters={
                "id": comment_id,
                "correspondence_id": comment_data.correspondence_id,
                "user_id": user_id,
                "comment": comment_data.comment,
                "is_internal": 1 if comment_data.is_internal else 0,
                "parent_comment_id": comment_data.parent_comment_id,
                "mentioned_users": comment_data.mentioned_users,
                "attachments": comment_data.attachments
            }
        )
        
        return {"id": comment_id, "message": "Comment created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create comment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create comment"
        )

@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    x_session_token: Optional[str] = Header(None)
):
    """Update a comment"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Note: ClickHouse doesn't support UPDATE in traditional way
    # You may need to implement this using ALTER TABLE UPDATE or mutations
    
    return {"message": "Comment update not fully implemented for ClickHouse"}

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    x_session_token: Optional[str] = Header(None)
):
    """Delete a comment"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Note: ClickHouse doesn't support DELETE in traditional way
    # You may need to implement this using ALTER TABLE DELETE or mutations
    
    return {"message": "Comment deletion not fully implemented for ClickHouse"}
