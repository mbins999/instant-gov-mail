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
