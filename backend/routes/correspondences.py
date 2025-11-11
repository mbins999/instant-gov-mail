from fastapi import APIRouter, HTTPException, status
from database import get_client
from models import CorrespondenceCreate
import uuid
from datetime import datetime

router = APIRouter(prefix="/correspondences", tags=["Correspondences"])

@router.get("")
async def list_correspondences():
    """List all correspondences"""
    client = get_client()
    
    try:
        result = client.query(
            f"""
            SELECT *, '' as status
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
                "external_connection_id": row[22],
                "status": row[23] if len(row) > 23 else ''
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
            SELECT *, '' as status
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
            "external_connection_id": row[22],
            "status": row[23] if len(row) > 23 else ''
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get correspondence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch correspondence"
        )

@router.post("/create")
async def create_correspondence(data: dict):
    """Create a new correspondence"""
    client = get_client()
    
    try:
        correspondence_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Insert into ClickHouse
        client.command(
            """
            INSERT INTO correspondences (
                id, number, type, subject, from_entity, received_by_entity, 
                date, content, greeting, responsible_person, signature_url, 
                display_type, attachments, notes, received_by, received_at, 
                created_by, created_at, updated_at, archived, status
            ) VALUES
            """,
            [
                (
                    correspondence_id,
                    data.get('number'),
                    data.get('type'),
                    data.get('subject'),
                    data.get('from_entity'),
                    data.get('received_by_entity'),
                    data.get('date'),
                    data.get('content', ''),
                    data.get('greeting', ''),
                    data.get('responsible_person', ''),
                    data.get('signature_url', ''),
                    data.get('display_type', 'content'),
                    data.get('attachments', []),
                    data.get('notes', ''),
                    data.get('received_by', 0),
                    data.get('received_at', None),
                    data.get('created_by'),
                    now,
                    now,
                    1 if data.get('archived', False) else 0,
                    data.get('status', '')
                )
            ]
        )
        
        return {
            "id": correspondence_id,
            "message": "Correspondence created successfully"
        }
        
    except Exception as e:
        print(f"Create correspondence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create correspondence: {str(e)}"
        )
