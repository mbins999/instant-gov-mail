from fastapi import APIRouter, HTTPException, status, Header, UploadFile, File, Form
from typing import Optional
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["File Upload"])

# Create upload directories
UPLOAD_DIR = Path("uploads")
ATTACHMENTS_DIR = UPLOAD_DIR / "attachments"
SIGNATURES_DIR = UPLOAD_DIR / "signatures"
PDFS_DIR = UPLOAD_DIR / "pdfs"

# Create directories if they don't exist
for directory in [ATTACHMENTS_DIR, SIGNATURES_DIR, PDFS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "attachments": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".txt"},
    "signatures": {".jpg", ".jpeg", ".png", ".svg"},
    "pdfs": {".pdf"}
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file: UploadFile, file_type: str) -> bool:
    """Validate file extension and size"""
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in ALLOWED_EXTENSIONS.get(file_type, set()):
        return False
    
    return True

@router.post("/attachment")
async def upload_attachment(
    file: UploadFile = File(...),
    x_session_token: Optional[str] = Header(None)
):
    """Upload an attachment file"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if not validate_file(file, "attachments"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )
    
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = ATTACHMENTS_DIR / unique_filename
        
        # Read and save file
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed size (10MB)"
            )
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Return file URL (adjust based on your serving setup)
        file_url = f"/uploads/attachments/{unique_filename}"
        
        return {
            "url": file_url,
            "filename": file.filename,
            "size": len(contents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload attachment error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file"
        )

@router.post("/signature")
async def upload_signature(
    file: UploadFile = File(...),
    x_session_token: Optional[str] = Header(None)
):
    """Upload a signature image"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if not validate_file(file, "signatures"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images allowed"
        )
    
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = SIGNATURES_DIR / unique_filename
        
        # Read and save file
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed size (10MB)"
            )
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_url = f"/uploads/signatures/{unique_filename}"
        
        return {
            "url": file_url,
            "filename": file.filename,
            "size": len(contents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload signature error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload signature"
        )

@router.post("/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    x_session_token: Optional[str] = Header(None)
):
    """Upload a PDF document"""
    if not x_session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if not validate_file(file, "pdfs"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    try:
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.pdf"
        file_path = PDFS_DIR / unique_filename
        
        # Read and save file
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed size (10MB)"
            )
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_url = f"/uploads/pdfs/{unique_filename}"
        
        return {
            "url": file_url,
            "filename": file.filename,
            "size": len(contents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload PDF error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload PDF"
        )
