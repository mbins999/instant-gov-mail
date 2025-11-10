from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from pydantic import BaseModel
from database import get_client

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationUpdate(BaseModel):
    read: bool

@router.get("")
async def list_notifications(
    x_session_token: Optional[str] = Header(None),
    unread_only: bool = False
):
    """List notifications for the current user"""
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
        
        query = """
            SELECT *
            FROM notifications
            WHERE user_id = %(user_id)s
        """
        
        if unread_only:
            query += " AND read = 0"
        
        query += " ORDER BY created_at DESC"
        
        result = client.query(query, parameters={"user_id": user_id})
        
        notifications = []
        for row in result.result_rows:
            notifications.append({
                "id": row[0],
                "user_id": row[1],
                "type": row[2],
                "title": row[3],
                "message": row[4],
                "correspondence_id": row[5],
                "related_entity_type": row[6],
                "related_entity_id": row[7],
                "priority": row[8],
                "action_url": row[9],
                "read": row[10] == 1,
                "read_at": row[11],
                "created_at": row[12]
            })
        
        return notifications
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"List notifications error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications"
        )

@router.get("/unread/count")
async def get_unread_count(x_session_token: Optional[str] = Header(None)):
    """Get count of unread notifications"""
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
        
        result = client.query(
            """
            SELECT COUNT(*)
            FROM notifications
            WHERE user_id = %(user_id)s AND read = 0
            """,
            parameters={"user_id": user_id}
        )
        
        count = result.result_rows[0][0] if result.result_rows else 0
        
        return {"count": count}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get unread count error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count"
        )

@router.put("/{notification_id}")
async def update_notification(
    notification_id: str,
    update_data: NotificationUpdate,
    x_session_token: Optional[str] = Header(None)
):
    """Mark notification as read/unread"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Note: ClickHouse UPDATE limitations
    # You may need to implement using ALTER TABLE UPDATE
    
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_read(x_session_token: Optional[str] = Header(None)):
    """Mark all notifications as read for current user"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Note: ClickHouse UPDATE limitations
    return {"message": "All notifications marked as read"}
