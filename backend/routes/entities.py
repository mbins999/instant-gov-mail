from fastapi import APIRouter, HTTPException, status
from database import get_client

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("")
async def list_entities():
    """List all entities"""
    client = get_client()
    
    try:
        result = client.query(
            f"""
            SELECT *
            FROM entities
            ORDER BY name ASC
            """
        )
        
        entities = []
        for row in result.result_rows:
            entities.append({
                "id": row[0],
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
