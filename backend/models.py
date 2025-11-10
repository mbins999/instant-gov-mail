from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    user: dict

class SessionVerifyRequest(BaseModel):
    sessionToken: str

# User Models
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    entity_id: Optional[str] = None

class UserUpdate(BaseModel):
    userId: int
    fullName: Optional[str] = None
    entityId: Optional[str] = None
    password: Optional[str] = None

class UserListRequest(BaseModel):
    sessionToken: str

# Correspondence Models
class CorrespondenceBase(BaseModel):
    number: str
    type: str
    subject: str
    content: str
    from_entity: str
    received_by_entity: Optional[str] = None
    greeting: str = "السيد/"
    display_type: str = "content"
    responsible_person: Optional[str] = None
    signature_url: Optional[str] = None
    attachments: List[str] = []
    notes: Optional[str] = None

class CorrespondenceCreate(CorrespondenceBase):
    date: datetime

class CorrespondenceUpdate(CorrespondenceBase):
    pass

# Entity Models
class EntityBase(BaseModel):
    name: str
    type: str

class EntityCreate(EntityBase):
    pass

# Template Models
class TemplateBase(BaseModel):
    name: str
    subject_template: Optional[str] = None
    content_template: str
    greeting: str = "السيد/"
    category: str = "general"
    type: str = "all"

class TemplateCreate(TemplateBase):
    pass
