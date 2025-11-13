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
            SELECT 
                id, number, type, subject, content, from_entity, 
                received_by_entity, date, received_at, received_by, 
                created_by, created_at, updated_at, archived, 
                display_type, greeting, responsible_person, signature_url, 
                pdf_url, notes, attachments, external_connection_id, 
                external_doc_id, status
            FROM correspondences
            ORDER BY date DESC
            """
        )
        
        correspondences = []
        for row in result.result_rows:
            # Map row using correct column positions
            correspondences.append({
                "id": row[0],                        # id
                "number": row[1],                    # number
                "type": row[2],                      # type
                "subject": row[3],                   # subject
                "content": row[4],                   # content ✓
                "from": row[5],                      # from_entity
                "from_entity": row[5],              # from_entity
                "received_by_entity": row[6],       # received_by_entity
                "date": row[7],                      # date
                "received_at": row[8],              # received_at
                "received_by": row[9],              # received_by
                "created_by": row[10],              # created_by
                "created_at": row[11],              # created_at
                "updated_at": row[12],              # updated_at
                "archived": row[13] == 1,           # archived
                "display_type": row[14],            # display_type
                "greeting": row[15],                # greeting ✓
                "responsible_person": row[16],      # responsible_person ✓
                "signature_url": row[17],           # signature_url ✓
                "pdf_url": row[18],                 # pdf_url
                "notes": row[19],                   # notes
                "attachments": row[20] if row[20] else [],  # attachments
                "external_connection_id": row[21],  # external_connection_id
                "external_doc_id": row[22],         # external_doc_id
                "status": row[23] if len(row) > 23 else 'sent'  # status
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
            SELECT 
                id, number, type, subject, content, from_entity, 
                received_by_entity, date, received_at, received_by, 
                created_by, created_at, updated_at, archived, 
                display_type, greeting, responsible_person, signature_url, 
                pdf_url, notes, attachments, external_connection_id, 
                external_doc_id, status
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
            "id": row[0],                        # id
            "number": row[1],                    # number
            "type": row[2],                      # type
            "subject": row[3],                   # subject
            "content": row[4],                   # content ✓
            "from": row[5],                      # from_entity
            "from_entity": row[5],              # from_entity
            "received_by_entity": row[6],       # received_by_entity
            "date": row[7],                      # date
            "received_at": row[8],              # received_at
            "received_by": row[9],              # received_by
            "created_by": row[10],              # created_by
            "created_at": row[11],              # created_at
            "updated_at": row[12],              # updated_at
            "archived": row[13] == 1,           # archived
            "display_type": row[14],            # display_type
            "greeting": row[15],                # greeting ✓
            "responsible_person": row[16],      # responsible_person ✓
            "signature_url": row[17],           # signature_url ✓
            "pdf_url": row[18],                 # pdf_url
            "notes": row[19],                   # notes
            "attachments": row[20] if row[20] else [],  # attachments
            "external_connection_id": row[21],  # external_connection_id
            "external_doc_id": row[22],         # external_doc_id
            "status": row[23] if len(row) > 23 else 'sent'  # status
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
        
        # Build UPDATE query - ClickHouse ALTER TABLE UPDATE doesn't support parameterized queries well
        # We'll build the query with proper value formatting
        update_fields = []
        
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
        
        def format_value(value):
            """Format value for ClickHouse query"""
            if value is None:
                return 'NULL'
            elif isinstance(value, bool):
                return '1' if value else '0'
            elif isinstance(value, (int, float)):
                return str(value)
            elif isinstance(value, list):
                # Format array of strings
                escaped_items = [f"'{str(item).replace(chr(39), chr(39)+chr(39))}'" for item in value]
                return f"[{', '.join(escaped_items)}]"
            else:
                # Escape single quotes by doubling them
                escaped = str(value).replace("'", "''")
                return f"'{escaped}'"
        
        for data_key, db_field in field_mappings.items():
            if data_key in data:
                value = data[data_key]
                if data_key == 'archived' and isinstance(value, bool):
                    value = 1 if value else 0
                formatted_value = format_value(value)
                update_fields.append(f"{db_field} = {formatted_value}")
        
        if 'attachments' in data:
            formatted_attachments = format_value(data['attachments'])
            update_fields.append(f"attachments = {formatted_attachments}")
        
        # Note: date field cannot be updated in ClickHouse as it's part of ORDER BY
        # So we skip it even if provided in the data
        
        formatted_now = f"'{now.strftime('%Y-%m-%d %H:%M:%S')}'"
        update_fields.append(f"updated_at = {formatted_now}")
        
        # Escape single quotes in correspondence_id
        escaped_id = correspondence_id.replace("'", "''")
        
        query = f"""
            ALTER TABLE correspondences
            UPDATE {', '.join(update_fields)}
            WHERE id = '{escaped_id}'
        """
        
        print(f"Executing update query: {query}")
        client.command(query)
        
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
