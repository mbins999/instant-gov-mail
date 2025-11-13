from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from database import get_client

router = APIRouter(prefix="/statistics", tags=["Statistics"])

@router.get("/dashboard")
async def get_dashboard_stats(x_session_token: Optional[str] = Header(None)):
    """Get dashboard statistics"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        # Get various statistics
        stats = {}
        
        # Total correspondences
        result = client.query("SELECT COUNT(*) FROM correspondences")
        stats["total_correspondences"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Total users
        result = client.query("SELECT COUNT(*) FROM users")
        stats["total_users"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Total entities
        result = client.query("SELECT COUNT(*) FROM entities")
        stats["total_entities"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Active sessions
        result = client.query("SELECT COUNT(*) FROM sessions WHERE expires_at > now()")
        stats["active_sessions"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Correspondences this month
        result = client.query("""
            SELECT COUNT(*) 
            FROM correspondences 
            WHERE toStartOfMonth(created_at) = toStartOfMonth(now())
        """)
        stats["month_correspondences"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Correspondences this week
        result = client.query("""
            SELECT COUNT(*) 
            FROM correspondences 
            WHERE toStartOfWeek(created_at) = toStartOfWeek(now())
        """)
        stats["week_correspondences"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Correspondences today
        result = client.query("""
            SELECT COUNT(*) 
            FROM correspondences 
            WHERE toDate(created_at) = today()
        """)
        stats["today_correspondences"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Unread notifications count
        result = client.query("SELECT COUNT(*) FROM notifications WHERE read = 0")
        stats["unread_notifications"] = result.result_rows[0][0] if result.result_rows else 0
        
        # Active templates
        result = client.query("SELECT COUNT(*) FROM correspondence_templates WHERE is_active = 1")
        stats["active_templates"] = result.result_rows[0][0] if result.result_rows else 0
        
        return stats
        
    except Exception as e:
        print(f"Get dashboard stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )

@router.get("/correspondences/by-type")
async def get_correspondences_by_type(x_session_token: Optional[str] = Header(None)):
    """Get correspondence counts by type"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query("""
            SELECT type, COUNT(*) as count
            FROM correspondences
            GROUP BY type
        """)
        
        stats = []
        for row in result.result_rows:
            stats.append({
                "type": row[0],
                "count": row[1]
            })
        
        return stats
        
    except Exception as e:
        print(f"Get correspondences by type error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )

@router.get("/correspondences/by-entity")
async def get_correspondences_by_entity(x_session_token: Optional[str] = Header(None)):
    """Get correspondence counts by entity"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query("""
            SELECT from_entity, COUNT(*) as count
            FROM correspondences
            GROUP BY from_entity
            ORDER BY count DESC
            LIMIT 10
        """)
        
        stats = []
        for row in result.result_rows:
            stats.append({
                "entity": row[0],
                "count": row[1]
            })
        
        return stats
        
    except Exception as e:
        print(f"Get correspondences by entity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )

@router.get("/correspondences/timeline")
async def get_correspondences_timeline(
    x_session_token: Optional[str] = Header(None),
    days: int = 30
):
    """Get correspondence timeline for the last N days"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query(f"""
            SELECT 
                toDate(created_at) as date,
                COUNT(*) as count
            FROM correspondences
            WHERE created_at >= today() - INTERVAL {days} DAY
            GROUP BY date
            ORDER BY date ASC
        """)
        
        timeline = []
        for row in result.result_rows:
            timeline.append({
                "date": row[0],
                "count": row[1]
            })
        
        return timeline
        
    except Exception as e:
        print(f"Get correspondences timeline error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch timeline"
        )

@router.get("/monthly-stats")
async def get_monthly_stats(x_session_token: Optional[str] = Header(None)):
    """Get monthly correspondence statistics"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query("""
            SELECT 
                toStartOfMonth(date) as month,
                type,
                COUNT(*) as total_count,
                countIf(received_at IS NOT NULL) as received_count,
                countIf(archived = 1) as archived_count,
                countIf(content != '') as with_content_count,
                countIf(signature_url != '') as with_signature_count,
                countIf(content = '' AND arrayExists(x -> true, attachments)) as attachment_only_count,
                avg(date_diff('hour', created_at, received_at)) as avg_hours_to_receive,
                from_entity,
                received_by_entity
            FROM correspondences
            WHERE date >= today() - INTERVAL 12 MONTH
            GROUP BY month, type, from_entity, received_by_entity
            ORDER BY month DESC
        """)
        
        stats = []
        for row in result.result_rows:
            stats.append({
                "month": row[0],
                "type": row[1],
                "total_count": row[2],
                "received_count": row[3],
                "archived_count": row[4],
                "with_content_count": row[5],
                "with_signature_count": row[6],
                "attachment_only_count": row[7],
                "avg_hours_to_receive": float(row[8]) if row[8] else None,
                "from_entity": row[9],
                "received_by_entity": row[10]
            })
        
        return stats
        
    except Exception as e:
        print(f"Get monthly stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch monthly statistics"
        )

@router.get("/user-performance")
async def get_user_performance(x_session_token: Optional[str] = Header(None)):
    """Get user performance statistics"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query("""
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.entity_name,
                ur.role,
                COUNT(c.id) as total_correspondences,
                countIf(c.created_by = u.id) as created_count,
                countIf(c.received_by = u.id) as received_count,
                (SELECT COUNT(*) FROM correspondence_comments WHERE user_id = u.id) as comments_count,
                avg(date_diff('hour', c.created_at, c.received_at)) as avg_response_hours,
                max(c.created_at) as last_activity
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN correspondences c ON (c.created_by = u.id OR c.received_by = u.id)
            GROUP BY u.id, u.username, u.full_name, u.entity_name, ur.role
            HAVING total_correspondences > 0
            ORDER BY total_correspondences DESC
            LIMIT 20
        """)
        
        performance = []
        for row in result.result_rows:
            performance.append({
                "id": row[0],
                "username": row[1],
                "full_name": row[2],
                "entity_name": row[3],
                "role": row[4],
                "total_correspondences": row[5],
                "created_count": row[6],
                "received_count": row[7],
                "comments_count": row[8],
                "avg_response_hours": float(row[9]) if row[9] else None,
                "last_activity": row[10]
            })
        
        return performance
        
    except Exception as e:
        print(f"Get user performance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user performance"
        )

@router.get("/entity-stats")
async def get_entity_stats(x_session_token: Optional[str] = Header(None)):
    """Get entity statistics"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query("""
            SELECT 
                e.id,
                e.name,
                e.type,
                COUNT(DISTINCT c_sent.id) as sent_count,
                COUNT(DISTINCT c_received.id) as received_count,
                COUNT(DISTINCT c_sent.id) + COUNT(DISTINCT c_received.id) as total_correspondences,
                (SELECT COUNT(*) FROM users WHERE entity_id = e.id) as users_count,
                (SELECT COUNT(*) FROM correspondence_templates WHERE entity_id = e.id) as templates_count
            FROM entities e
            LEFT JOIN correspondences c_sent ON e.name = c_sent.from_entity
            LEFT JOIN correspondences c_received ON e.name = c_received.received_by_entity
            GROUP BY e.id, e.name, e.type
            ORDER BY total_correspondences DESC
        """)
        
        stats = []
        for row in result.result_rows:
            stats.append({
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "sent_count": row[3],
                "received_count": row[4],
                "total_correspondences": row[5],
                "users_count": row[6],
                "templates_count": row[7]
            })
        
        return stats
        
    except Exception as e:
        print(f"Get entity stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch entity statistics"
        )

@router.get("/daily-activity")
async def get_daily_activity(
    x_session_token: Optional[str] = Header(None),
    days: int = 30
):
    """Get daily activity statistics"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    client = get_client()
    
    try:
        result = client.query(f"""
            SELECT 
                toDate(created_at) as date,
                COUNT(DISTINCT created_by) as active_users,
                COUNT(*) as correspondences_created,
                countIf(received_at IS NOT NULL AND toDate(received_at) = toDate(created_at)) as correspondences_viewed,
                countIf(updated_at != created_at) as correspondences_updated,
                (SELECT COUNT(*) FROM sessions WHERE toDate(created_at) = toDate(c.created_at)) as logins
            FROM correspondences c
            WHERE created_at >= today() - INTERVAL {days} DAY
            GROUP BY date
            ORDER BY date DESC
            LIMIT {days}
        """)
        
        activity = []
        for row in result.result_rows:
            activity.append({
                "date": row[0],
                "active_users": row[1],
                "correspondences_created": row[2],
                "correspondences_viewed": row[3],
                "correspondences_updated": row[4],
                "logins": row[5]
            })
        
        return activity
        
    except Exception as e:
        print(f"Get daily activity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch daily activity"
        )
