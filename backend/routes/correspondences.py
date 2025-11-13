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
                "external_connection_id": row[22],
                "status": row[23] if len(row) > 23 else 'sent'
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
            "external_connection_id": row[22],
            "status": row[23] if len(row) > 23 else 'sent'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get correspondence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch correspondence"
        )

@router.put("/update/{correspondence_id}")
async def update_correspondence(correspondence_id: str, data: dict):
    """Update an existing correspondence"""
    client = get_client()
    
    try:
        now = datetime.utcnow()
        
        # Fetch current state to enforce locking rules for display_type
        try:
            current = client.query(
                f"""
                SELECT display_type, archived, status
                FROM correspondences
                WHERE id = %(id)s
                LIMIT 1
                """,
                parameters={"id": correspondence_id}
            )
        except Exception as e:
            print(f"Pre-check query error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to validate correspondence state")
        
        if not current.result_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correspondence not found")
        
        curr_display_type = current.result_rows[0][0]
        curr_archived = current.result_rows[0][1] == 1
        curr_status = current.result_rows[0][2] if len(current.result_rows[0]) > 2 else None
        
        # Convert date string to datetime object if needed
        date_value = data.get('date')
        if isinstance(date_value, str):
            date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
        
        # Validate and enforce immutability rules for display_type
        allowed_display_types = {"content", "attachment_only"}
        if 'display_type' in data:
            new_display_type = data.get('display_type')
            if new_display_type not in allowed_display_types:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid display_type. Must be 'content' or 'attachment_only'")
            # If archived already, or already sent, or this update archives/sends it, disallow changing display_type
            will_archive = bool(data.get('archived') is True)
            will_send = data.get('status') in ('sent',)
            locked_now = curr_archived or (curr_status in ('sent',))
            if new_display_type != curr_display_type and (locked_now or will_archive or will_send):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="display_type cannot be modified after archiving or external send")
        
        # Build UPDATE query
        update_fields = []
        params = {'id': correspondence_id}
        
        field_mappings = {
            'number': 'number',
            'type': 'type',
            'subject': 'subject',
            'from_entity': 'from_entity',
            'received_by_entity': 'received_by_entity',
            'content': 'content',
            'greeting': 'greeting',
            'responsible_person': 'responsible_person',
            'signature_url': 'signature_url',
            'display_type': 'display_type',
            'notes': 'notes',
            'status': 'status',
            'archived': 'archived'
        }
        
        for data_key, db_field in field_mappings.items():
            if data_key in data:
                value = data[data_key]
                if data_key == 'archived' and isinstance(value, bool):
                    value = 1 if value else 0
                update_fields.append(f"{db_field} = %({data_key})s")
                params[data_key] = value
        
        if 'attachments' in data:
            update_fields.append("attachments = %(attachments)s")
            params['attachments'] = data['attachments']
        
        if date_value:
            update_fields.append("date = %(date)s")
            params['date'] = date_value
        
        update_fields.append("updated_at = %(updated_at)s")
        params['updated_at'] = now
        
        query = f"""
            ALTER TABLE correspondences
            UPDATE {', '.join(update_fields)}
            WHERE id = %(id)s
        """
        
        client.command(query, parameters=params)
        
        return {
            "id": correspondence_id,
            "message": "Correspondence updated successfully"
        }
        
    except Exception as e:
        print(f"Update correspondence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update correspondence: {str(e)}"
        )

@router.post("/create")
async def create_correspondence(data: dict):
    """Create a new correspondence"""
    client = get_client()
    
    try:
        correspondence_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Convert date string to datetime object
        date_value = data.get('date')
        if isinstance(date_value, str):
            date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
        
        # Validate required and allowed display_type
        allowed_display_types = {"content", "attachment_only"}
        display_type = data.get('display_type')
        if display_type not in allowed_display_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="display_type is required and must be 'content' or 'attachment_only'"
            )
        
        # Insert into ClickHouse
        client.insert(
            'correspondences',
            [[
                correspondence_id,
                data.get('number'),
                data.get('type'),
                data.get('subject'),
                data.get('from_entity'),
                data.get('received_by_entity', ''),
                date_value,
                data.get('content', ''),
                data.get('greeting', 'السيد/'),
                data.get('responsible_person', ''),
                data.get('signature_url', ''),
                data.get('display_type', 'content'),
                data.get('attachments', []),
                data.get('notes', ''),
                data.get('received_by', 0),
                data.get('received_at'),
                data.get('created_by'),
                now,
                now,
                1 if data.get('archived', False) else 0,
                data.get('pdf_url', ''),
                data.get('external_doc_id', ''),
                data.get('external_connection_id', ''),
                data.get('status', 'draft')
            ]],
            column_names=[
                'id', 'number', 'type', 'subject', 'from_entity', 'received_by_entity',
                'date', 'content', 'greeting', 'responsible_person', 'signature_url',
                'display_type', 'attachments', 'notes', 'received_by', 'received_at',
                'created_by', 'created_at', 'updated_at', 'archived', 'pdf_url',
                'external_doc_id', 'external_connection_id', 'status'
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
