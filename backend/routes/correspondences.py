from fastapi import APIRouter, HTTPException, status
from database import get_client

router = APIRouter(prefix="/correspondences", tags=["Correspondences"])

@router.get("")
async def list_correspondences():
    """List all correspondences"""
    client = get_client()
    
    try:
        result = client.query(
            f"""
            SELECT *
            FROM correspondences
            ORDER BY date DESC
            """
        )
        
        correspondences = []
        for row in result.result_rows:
            # Map row to correspondence object
            correspondences.append({
                "id": row[0],
                "number": row[1],
                "type": row[2],
                "subject": row[3],
                "from": row[4],
                "from_entity": row[4],
                "received_by_entity": row[5],
                "date": row[6],
                "content": row[7],
                "greeting": row[8],
                "responsible_person": row[9],
                "signature_url": row[10],
                "display_type": row[11],
                "attachments": row[12] if row[12] else [],
                "notes": row[13],
                "received_by": row[14],
                "received_at": row[15],
                "created_by": row[16],
                "created_at": row[17],
                "updated_at": row[18],
                "archived": row[19] == 1,
                "pdf_url": row[20],
                "external_doc_id": row[21],
                "external_connection_id": row[22]
            })
        
        return correspondences
        
    except Exception as e:
        print(f"List correspondences error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch correspondences"
        )

@router.get("/{correspondence_id}")
async def get_correspondence(correspondence_id: str):
    """Get a single correspondence by ID"""
    client = get_client()
    
    try:
        result = client.query(
            f"""
            SELECT *
            FROM correspondences
            WHERE id = %(id)s
            LIMIT 1
            """,
            parameters={"id": correspondence_id}
        )
        
        if not result.result_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Correspondence not found"
            )
        
        row = result.result_rows[0]
        
        return {
            "id": row[0],
            "number": row[1],
            "type": row[2],
            "subject": row[3],
            "from": row[4],
            "from_entity": row[4],
            "received_by_entity": row[5],
            "date": row[6],
            "content": row[7],
            "greeting": row[8],
            "responsible_person": row[9],
            "signature_url": row[10],
            "display_type": row[11],
            "attachments": row[12] if row[12] else [],
            "notes": row[13],
            "received_by": row[14],
            "received_at": row[15],
            "created_by": row[16],
            "created_at": row[17],
            "updated_at": row[18],
            "archived": row[19] == 1,
            "pdf_url": row[20],
            "external_doc_id": row[21],
            "external_connection_id": row[22]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get correspondence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch correspondence"
        )
