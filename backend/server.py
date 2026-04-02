from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import shutil
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'museum-cms-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="HeritageOS API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/admin/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/admin/users", tags=["Users"])
roles_router = APIRouter(prefix="/admin/roles", tags=["Roles"])
artifacts_router = APIRouter(prefix="/admin/artifacts", tags=["Artifacts"])
categories_router = APIRouter(prefix="/admin/categories", tags=["Categories"])
galleries_router = APIRouter(prefix="/admin/galleries", tags=["Galleries"])
timelines_router = APIRouter(prefix="/admin/timelines", tags=["Timelines"])
media_router = APIRouter(prefix="/admin/media", tags=["Media"])
sections_router = APIRouter(prefix="/admin/frontend-sections", tags=["Frontend Sections"])
dashboard_router = APIRouter(prefix="/admin/dashboard", tags=["Dashboard"])

# ==================== MODELS ====================

# Base Models
class TimestampModel(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class TokenData(BaseModel):
    user_id: str
    email: str
    role: str

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[str] = None
    status: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    role_id: str
    role_name: Optional[str] = None
    status: str
    last_login: Optional[str] = None
    created_at: str
    updated_at: str

# Role Models
class RoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    role_name: str
    description: Optional[str] = None
    permissions: List[str] = []

# Permission list
PERMISSIONS = [
    "create_artifact", "edit_artifact", "delete_artifact", "publish_artifact",
    "create_gallery", "edit_gallery", "delete_gallery",
    "create_timeline", "edit_timeline", "delete_timeline",
    "manage_users", "manage_roles", "edit_frontend_sections",
    "upload_media", "delete_media", "manage_categories"
]

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int
    created_at: str

# Artifact Models
class ArtifactCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_category_id: Optional[str] = None
    era: Optional[str] = None
    tags: List[str] = []
    thumbnail_image: Optional[str] = None
    artifact_date: Optional[str] = None
    location: Optional[str] = None
    source_reference: Optional[str] = None
    status: str = "draft"
    media_ids: List[str] = []

class ArtifactUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_category_id: Optional[str] = None
    era: Optional[str] = None
    tags: Optional[List[str]] = None
    thumbnail_image: Optional[str] = None
    artifact_date: Optional[str] = None
    location: Optional[str] = None
    source_reference: Optional[str] = None
    status: Optional[str] = None
    media_ids: Optional[List[str]] = None

class ArtifactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    slug: str
    description: Optional[str] = None
    subject_category_id: Optional[str] = None
    category_name: Optional[str] = None
    era: Optional[str] = None
    tags: List[str] = []
    thumbnail_image: Optional[str] = None
    artifact_date: Optional[str] = None
    location: Optional[str] = None
    source_reference: Optional[str] = None
    status: str
    created_by: str
    created_at: str
    updated_at: str
    media_ids: List[str] = []

# Gallery Models
class GalleryArtifact(BaseModel):
    artifact_id: str
    display_order: int

class GalleryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    status: str = "draft"
    artifacts: List[GalleryArtifact] = []

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None
    artifacts: Optional[List[GalleryArtifact]] = None

class GalleryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    status: str
    artifacts: List[Dict[str, Any]] = []
    created_at: str

# Timeline Models
class TimelineEventArtifact(BaseModel):
    artifact_id: str

class TimelineEventCreate(BaseModel):
    event_title: str
    event_date: Optional[str] = None
    event_year: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    display_order: int = 0
    artifacts: List[str] = []

class TimelineEventUpdate(BaseModel):
    event_title: Optional[str] = None
    event_date: Optional[str] = None
    event_year: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    display_order: Optional[int] = None
    artifacts: Optional[List[str]] = None

class TimelineEventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    timeline_id: str
    event_title: str
    event_date: Optional[str] = None
    event_year: Optional[int] = None
    description: Optional[str] = None
    location: Optional[str] = None
    display_order: int
    artifacts: List[Dict[str, Any]] = []

class TimelineCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    era_range: Optional[str] = None

class TimelineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    era_range: Optional[str] = None

class TimelineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    era_range: Optional[str] = None
    events_count: int = 0
    created_at: str

# Media Models
class MediaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    file_name: str
    file_type: str
    file_path: str
    file_size: int
    uploaded_by: str
    created_at: str

# Frontend Section Models
class SectionItemCreate(BaseModel):
    artifact_id: Optional[str] = None
    gallery_id: Optional[str] = None
    timeline_id: Optional[str] = None
    custom_text: Optional[str] = None

class SectionCreate(BaseModel):
    section_name: str
    section_type: str  # hero_banner, featured_artifacts, featured_galleries, timeline_preview, image_banner, video_section, text_section
    data_source: Optional[str] = None
    display_order: int = 0
    is_visible: bool = True
    background_image: Optional[str] = None
    items: List[SectionItemCreate] = []

class SectionUpdate(BaseModel):
    section_name: Optional[str] = None
    section_type: Optional[str] = None
    data_source: Optional[str] = None
    display_order: Optional[int] = None
    is_visible: Optional[bool] = None
    background_image: Optional[str] = None
    items: Optional[List[SectionItemCreate]] = None

class SectionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    section_name: str
    section_type: str
    data_source: Optional[str] = None
    display_order: int
    is_visible: bool
    background_image: Optional[str] = None
    items: List[Dict[str, Any]] = []

# ==================== UTILITY FUNCTIONS ====================

def generate_slug(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenData(
            user_id=payload.get("user_id"),
            email=payload.get("email"),
            role=payload.get("role")
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def check_permission(user: TokenData, required_permission: str):
    role = await db.roles.find_one({"role_name": user.role}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=403, detail="Role not found")
    if user.role == "Super Admin" or required_permission in role.get("permissions", []):
        return True
    raise HTTPException(status_code=403, detail="Insufficient permissions")

# ==================== AUTH ROUTES ====================

@auth_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("status") != "active":
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    # Get role name
    role = await db.roles.find_one({"id": user["role_id"]}, {"_id": 0})
    role_name = role["role_name"] if role else "Unknown"
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": role_name
    })
    
    return LoginResponse(
        access_token=token,
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": role_name
        }
    )

@auth_router.get("/me")
async def get_me(current_user: TokenData = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user.user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = await db.roles.find_one({"id": user["role_id"]}, {"_id": 0})
    user["role_name"] = role["role_name"] if role else "Unknown"
    user["permissions"] = role.get("permissions", []) if role else []
    return user

# ==================== USER ROUTES ====================

@users_router.get("", response_model=List[UserResponse])
async def list_users(current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_users")
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        role = await db.roles.find_one({"id": user.get("role_id")}, {"_id": 0})
        user["role_name"] = role["role_name"] if role else None
    return users

@users_router.post("", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_users")
    
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role_id": user.role_id,
        "status": "active",
        "last_login": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    del user_doc["password"]
    
    role = await db.roles.find_one({"id": user.role_id}, {"_id": 0})
    user_doc["role_name"] = role["role_name"] if role else None
    
    return user_doc

@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_users")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = await db.roles.find_one({"id": user.get("role_id")}, {"_id": 0})
    user["role_name"] = role["role_name"] if role else None
    return user

@users_router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user: UserUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_users")
    
    update_data = {k: v for k, v in user.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    role = await db.roles.find_one({"id": updated_user.get("role_id")}, {"_id": 0})
    updated_user["role_name"] = role["role_name"] if role else None
    return updated_user

@users_router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_users")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ==================== ROLE ROUTES ====================

@roles_router.get("/permissions")
async def list_permissions(current_user: TokenData = Depends(get_current_user)):
    return {"permissions": PERMISSIONS}

@roles_router.get("", response_model=List[RoleResponse])
async def list_roles(current_user: TokenData = Depends(get_current_user)):
    roles = await db.roles.find({}, {"_id": 0}).to_list(1000)
    return roles

@roles_router.post("", response_model=RoleResponse)
async def create_role(role: RoleCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_roles")
    
    role_doc = {
        "id": str(uuid.uuid4()),
        "role_name": role.role_name,
        "description": role.description,
        "permissions": role.permissions
    }
    
    await db.roles.insert_one(role_doc)
    return role_doc

@roles_router.get("/{role_id}", response_model=RoleResponse)
async def get_role(role_id: str, current_user: TokenData = Depends(get_current_user)):
    role = await db.roles.find_one({"id": role_id}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@roles_router.put("/{role_id}", response_model=RoleResponse)
async def update_role(role_id: str, role: RoleUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_roles")
    
    update_data = {k: v for k, v in role.model_dump().items() if v is not None}
    
    result = await db.roles.update_one({"id": role_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return await db.roles.find_one({"id": role_id}, {"_id": 0})

@roles_router.delete("/{role_id}")
async def delete_role(role_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_roles")
    result = await db.roles.delete_one({"id": role_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role deleted successfully"}

# ==================== CATEGORY ROUTES ====================

@categories_router.get("", response_model=List[CategoryResponse])
async def list_categories(current_user: TokenData = Depends(get_current_user)):
    categories = await db.categories.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    return categories

@categories_router.post("", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_categories")
    
    category_doc = {
        "id": str(uuid.uuid4()),
        "name": category.name,
        "description": category.description,
        "icon": category.icon,
        "display_order": category.display_order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(category_doc)
    return category_doc

@categories_router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str, current_user: TokenData = Depends(get_current_user)):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@categories_router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_categories")
    
    update_data = {k: v for k, v in category.model_dump().items() if v is not None}
    
    result = await db.categories.update_one({"id": category_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return await db.categories.find_one({"id": category_id}, {"_id": 0})

@categories_router.delete("/{category_id}")
async def delete_category(category_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "manage_categories")
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== ARTIFACT ROUTES ====================

@artifacts_router.get("", response_model=List[ArtifactResponse])
async def list_artifacts(
    current_user: TokenData = Depends(get_current_user),
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tags: Optional[str] = Query(None)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    if category_id:
        query["subject_category_id"] = category_id
    
    if status:
        query["status"] = status
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    artifacts = await db.artifacts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Add category names
    for artifact in artifacts:
        if artifact.get("subject_category_id"):
            category = await db.categories.find_one({"id": artifact["subject_category_id"]}, {"_id": 0})
            artifact["category_name"] = category["name"] if category else None
    
    return artifacts

@artifacts_router.post("", response_model=ArtifactResponse)
async def create_artifact(artifact: ArtifactCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "create_artifact")
    
    now = datetime.now(timezone.utc).isoformat()
    artifact_doc = {
        "id": str(uuid.uuid4()),
        "title": artifact.title,
        "slug": generate_slug(artifact.title),
        "description": artifact.description,
        "subject_category_id": artifact.subject_category_id,
        "era": artifact.era,
        "tags": artifact.tags,
        "thumbnail_image": artifact.thumbnail_image,
        "artifact_date": artifact.artifact_date,
        "location": artifact.location,
        "source_reference": artifact.source_reference,
        "status": artifact.status,
        "created_by": current_user.user_id,
        "media_ids": artifact.media_ids,
        "created_at": now,
        "updated_at": now
    }
    
    await db.artifacts.insert_one(artifact_doc)
    
    if artifact.subject_category_id:
        category = await db.categories.find_one({"id": artifact.subject_category_id}, {"_id": 0})
        artifact_doc["category_name"] = category["name"] if category else None
    
    return artifact_doc

@artifacts_router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(artifact_id: str, current_user: TokenData = Depends(get_current_user)):
    artifact = await db.artifacts.find_one({"id": artifact_id}, {"_id": 0})
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    if artifact.get("subject_category_id"):
        category = await db.categories.find_one({"id": artifact["subject_category_id"]}, {"_id": 0})
        artifact["category_name"] = category["name"] if category else None
    
    return artifact

@artifacts_router.put("/{artifact_id}", response_model=ArtifactResponse)
async def update_artifact(artifact_id: str, artifact: ArtifactUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_artifact")
    
    update_data = {k: v for k, v in artifact.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "title" in update_data:
        update_data["slug"] = generate_slug(update_data["title"])
    
    result = await db.artifacts.update_one({"id": artifact_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    updated = await db.artifacts.find_one({"id": artifact_id}, {"_id": 0})
    if updated.get("subject_category_id"):
        category = await db.categories.find_one({"id": updated["subject_category_id"]}, {"_id": 0})
        updated["category_name"] = category["name"] if category else None
    
    return updated

@artifacts_router.delete("/{artifact_id}")
async def delete_artifact(artifact_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "delete_artifact")
    result = await db.artifacts.delete_one({"id": artifact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return {"message": "Artifact deleted successfully"}

@artifacts_router.put("/{artifact_id}/publish")
async def publish_artifact(artifact_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "publish_artifact")
    
    result = await db.artifacts.update_one(
        {"id": artifact_id},
        {"$set": {"status": "published", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Artifact not found")
    
    return {"message": "Artifact published successfully"}

# ==================== GALLERY ROUTES ====================

@galleries_router.get("", response_model=List[GalleryResponse])
async def list_galleries(current_user: TokenData = Depends(get_current_user)):
    galleries = await db.galleries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for gallery in galleries:
        artifact_details = []
        for art in gallery.get("artifacts", []):
            artifact = await db.artifacts.find_one({"id": art["artifact_id"]}, {"_id": 0})
            if artifact:
                artifact_details.append({
                    **art,
                    "title": artifact["title"],
                    "thumbnail_image": artifact.get("thumbnail_image")
                })
        gallery["artifacts"] = artifact_details
    
    return galleries

@galleries_router.post("", response_model=GalleryResponse)
async def create_gallery(gallery: GalleryCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "create_gallery")
    
    gallery_doc = {
        "id": str(uuid.uuid4()),
        "title": gallery.title,
        "description": gallery.description,
        "thumbnail": gallery.thumbnail,
        "status": gallery.status,
        "artifacts": [a.model_dump() for a in gallery.artifacts],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.galleries.insert_one(gallery_doc)
    return gallery_doc

@galleries_router.get("/{gallery_id}", response_model=GalleryResponse)
async def get_gallery(gallery_id: str, current_user: TokenData = Depends(get_current_user)):
    gallery = await db.galleries.find_one({"id": gallery_id}, {"_id": 0})
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    
    artifact_details = []
    for art in gallery.get("artifacts", []):
        artifact = await db.artifacts.find_one({"id": art["artifact_id"]}, {"_id": 0})
        if artifact:
            artifact_details.append({
                **art,
                "title": artifact["title"],
                "thumbnail_image": artifact.get("thumbnail_image")
            })
    gallery["artifacts"] = artifact_details
    
    return gallery

@galleries_router.put("/{gallery_id}", response_model=GalleryResponse)
async def update_gallery(gallery_id: str, gallery: GalleryUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_gallery")
    
    update_data = {}
    for k, v in gallery.model_dump().items():
        if v is not None:
            if k == "artifacts":
                update_data[k] = [a if isinstance(a, dict) else a.model_dump() for a in v]
            else:
                update_data[k] = v
    
    result = await db.galleries.update_one({"id": gallery_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found")
    
    return await db.galleries.find_one({"id": gallery_id}, {"_id": 0})

@galleries_router.delete("/{gallery_id}")
async def delete_gallery(gallery_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "delete_gallery")
    result = await db.galleries.delete_one({"id": gallery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery not found")
    return {"message": "Gallery deleted successfully"}

# ==================== TIMELINE ROUTES ====================

@timelines_router.get("", response_model=List[TimelineResponse])
async def list_timelines(current_user: TokenData = Depends(get_current_user)):
    timelines = await db.timelines.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for timeline in timelines:
        events_count = await db.timeline_events.count_documents({"timeline_id": timeline["id"]})
        timeline["events_count"] = events_count
    
    return timelines

@timelines_router.post("", response_model=TimelineResponse)
async def create_timeline(timeline: TimelineCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "create_timeline")
    
    timeline_doc = {
        "id": str(uuid.uuid4()),
        "title": timeline.title,
        "description": timeline.description,
        "cover_image": timeline.cover_image,
        "era_range": timeline.era_range,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.timelines.insert_one(timeline_doc)
    timeline_doc["events_count"] = 0
    return timeline_doc

@timelines_router.get("/{timeline_id}", response_model=TimelineResponse)
async def get_timeline(timeline_id: str, current_user: TokenData = Depends(get_current_user)):
    timeline = await db.timelines.find_one({"id": timeline_id}, {"_id": 0})
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    events_count = await db.timeline_events.count_documents({"timeline_id": timeline_id})
    timeline["events_count"] = events_count
    
    return timeline

@timelines_router.put("/{timeline_id}", response_model=TimelineResponse)
async def update_timeline(timeline_id: str, timeline: TimelineUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_timeline")
    
    update_data = {k: v for k, v in timeline.model_dump().items() if v is not None}
    
    result = await db.timelines.update_one({"id": timeline_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    updated = await db.timelines.find_one({"id": timeline_id}, {"_id": 0})
    events_count = await db.timeline_events.count_documents({"timeline_id": timeline_id})
    updated["events_count"] = events_count
    return updated

@timelines_router.delete("/{timeline_id}")
async def delete_timeline(timeline_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "delete_timeline")
    
    # Delete associated events
    await db.timeline_events.delete_many({"timeline_id": timeline_id})
    
    result = await db.timelines.delete_one({"id": timeline_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return {"message": "Timeline deleted successfully"}

# Timeline Events
@timelines_router.get("/{timeline_id}/events", response_model=List[TimelineEventResponse])
async def list_timeline_events(timeline_id: str, current_user: TokenData = Depends(get_current_user)):
    events = await db.timeline_events.find({"timeline_id": timeline_id}, {"_id": 0}).sort("event_year", 1).to_list(1000)
    
    for event in events:
        artifact_details = []
        for artifact_id in event.get("artifacts", []):
            artifact = await db.artifacts.find_one({"id": artifact_id}, {"_id": 0})
            if artifact:
                artifact_details.append({
                    "id": artifact["id"],
                    "title": artifact["title"],
                    "thumbnail_image": artifact.get("thumbnail_image")
                })
        event["artifacts"] = artifact_details
    
    return events

@timelines_router.post("/{timeline_id}/events", response_model=TimelineEventResponse)
async def create_timeline_event(timeline_id: str, event: TimelineEventCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_timeline")
    
    # Verify timeline exists
    timeline = await db.timelines.find_one({"id": timeline_id})
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    event_doc = {
        "id": str(uuid.uuid4()),
        "timeline_id": timeline_id,
        "event_title": event.event_title,
        "event_date": event.event_date,
        "event_year": event.event_year,
        "description": event.description,
        "location": event.location,
        "display_order": event.display_order,
        "artifacts": event.artifacts
    }
    
    await db.timeline_events.insert_one(event_doc)
    
    # Get artifact details
    artifact_details = []
    for artifact_id in event.artifacts:
        artifact = await db.artifacts.find_one({"id": artifact_id}, {"_id": 0})
        if artifact:
            artifact_details.append({
                "id": artifact["id"],
                "title": artifact["title"],
                "thumbnail_image": artifact.get("thumbnail_image")
            })
    event_doc["artifacts"] = artifact_details
    
    return event_doc

@timelines_router.put("/{timeline_id}/events/{event_id}", response_model=TimelineEventResponse)
async def update_timeline_event(timeline_id: str, event_id: str, event: TimelineEventUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_timeline")
    
    update_data = {k: v for k, v in event.model_dump().items() if v is not None}
    
    result = await db.timeline_events.update_one(
        {"id": event_id, "timeline_id": timeline_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    updated = await db.timeline_events.find_one({"id": event_id}, {"_id": 0})
    
    artifact_details = []
    for artifact_id in updated.get("artifacts", []):
        artifact = await db.artifacts.find_one({"id": artifact_id}, {"_id": 0})
        if artifact:
            artifact_details.append({
                "id": artifact["id"],
                "title": artifact["title"],
                "thumbnail_image": artifact.get("thumbnail_image")
            })
    updated["artifacts"] = artifact_details
    
    return updated

@timelines_router.delete("/{timeline_id}/events/{event_id}")
async def delete_timeline_event(timeline_id: str, event_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_timeline")
    result = await db.timeline_events.delete_one({"id": event_id, "timeline_id": timeline_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# ==================== MEDIA ROUTES ====================

@media_router.get("", response_model=List[MediaResponse])
async def list_media(
    current_user: TokenData = Depends(get_current_user),
    search: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None)
):
    query = {}
    
    if search:
        query["file_name"] = {"$regex": search, "$options": "i"}
    
    if file_type:
        query["file_type"] = {"$regex": file_type, "$options": "i"}
    
    media = await db.media.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return media

@media_router.post("", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    await check_permission(current_user, "upload_media")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Determine file type category
    file_type = "document"
    if file_ext.lower() in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]:
        file_type = "image"
    elif file_ext.lower() in [".mp4", ".webm", ".mov", ".avi"]:
        file_type = "video"
    elif file_ext.lower() in [".mp3", ".wav", ".ogg", ".flac"]:
        file_type = "audio"
    elif file_ext.lower() in [".obj", ".gltf", ".glb", ".fbx"]:
        file_type = "3d_model"
    
    media_doc = {
        "id": str(uuid.uuid4()),
        "file_name": file.filename,
        "file_type": file_type,
        "file_path": f"/uploads/{unique_filename}",
        "file_size": file_size,
        "uploaded_by": current_user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.media.insert_one(media_doc)
    return media_doc

@media_router.get("/{media_id}", response_model=MediaResponse)
async def get_media(media_id: str, current_user: TokenData = Depends(get_current_user)):
    media = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@media_router.delete("/{media_id}")
async def delete_media(media_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "delete_media")
    
    media = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file from disk
    file_path = ROOT_DIR / media["file_path"].lstrip("/")
    if file_path.exists():
        file_path.unlink()
    
    await db.media.delete_one({"id": media_id})
    return {"message": "Media deleted successfully"}

# ==================== FRONTEND SECTIONS ROUTES ====================

@sections_router.get("", response_model=List[SectionResponse])
async def list_sections(current_user: TokenData = Depends(get_current_user)):
    sections = await db.frontend_sections.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)
    return sections

@sections_router.post("", response_model=SectionResponse)
async def create_section(section: SectionCreate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_frontend_sections")
    
    section_doc = {
        "id": str(uuid.uuid4()),
        "section_name": section.section_name,
        "section_type": section.section_type,
        "data_source": section.data_source,
        "display_order": section.display_order,
        "is_visible": section.is_visible,
        "background_image": section.background_image,
        "items": [item.model_dump() for item in section.items]
    }
    
    await db.frontend_sections.insert_one(section_doc)
    return section_doc

@sections_router.get("/{section_id}", response_model=SectionResponse)
async def get_section(section_id: str, current_user: TokenData = Depends(get_current_user)):
    section = await db.frontend_sections.find_one({"id": section_id}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@sections_router.put("/{section_id}", response_model=SectionResponse)
async def update_section(section_id: str, section: SectionUpdate, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_frontend_sections")
    
    update_data = {}
    for k, v in section.model_dump().items():
        if v is not None:
            if k == "items":
                update_data[k] = [item if isinstance(item, dict) else item.model_dump() for item in v]
            else:
                update_data[k] = v
    
    result = await db.frontend_sections.update_one({"id": section_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    
    return await db.frontend_sections.find_one({"id": section_id}, {"_id": 0})

@sections_router.delete("/{section_id}")
async def delete_section(section_id: str, current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_frontend_sections")
    result = await db.frontend_sections.delete_one({"id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}

@sections_router.put("/reorder", response_model=List[SectionResponse])
async def reorder_sections(orders: List[Dict[str, Any]], current_user: TokenData = Depends(get_current_user)):
    await check_permission(current_user, "edit_frontend_sections")
    
    for order in orders:
        await db.frontend_sections.update_one(
            {"id": order["id"]},
            {"$set": {"display_order": order["display_order"]}}
        )
    
    return await db.frontend_sections.find({}, {"_id": 0}).sort("display_order", 1).to_list(1000)

# ==================== DASHBOARD ROUTES ====================

@dashboard_router.get("/stats")
async def get_dashboard_stats(current_user: TokenData = Depends(get_current_user)):
    total_artifacts = await db.artifacts.count_documents({})
    published_artifacts = await db.artifacts.count_documents({"status": "published"})
    total_galleries = await db.galleries.count_documents({})
    total_timelines = await db.timelines.count_documents({})
    total_users = await db.users.count_documents({})
    total_media = await db.media.count_documents({})
    total_categories = await db.categories.count_documents({})
    
    return {
        "total_artifacts": total_artifacts,
        "published_artifacts": published_artifacts,
        "draft_artifacts": total_artifacts - published_artifacts,
        "total_galleries": total_galleries,
        "total_timelines": total_timelines,
        "total_users": total_users,
        "total_media": total_media,
        "total_categories": total_categories
    }

@dashboard_router.get("/recent_activity")
async def get_recent_activity(current_user: TokenData = Depends(get_current_user)):
    recent_artifacts = await db.artifacts.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_media = await db.media.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_galleries = await db.galleries.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "recent_artifacts": recent_artifacts,
        "recent_media": recent_media,
        "recent_galleries": recent_galleries
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed initial data for the CMS"""
    
    # Check if already seeded
    existing_admin = await db.users.find_one({"email": "admin@museum.com"})
    if existing_admin:
        return {"message": "Database already seeded"}
    
    # Create default roles
    roles = [
        {
            "id": str(uuid.uuid4()),
            "role_name": "Super Admin",
            "description": "Full system access",
            "permissions": PERMISSIONS
        },
        {
            "id": str(uuid.uuid4()),
            "role_name": "Content Manager",
            "description": "Manage content and media",
            "permissions": [
                "create_artifact", "edit_artifact", "delete_artifact", "publish_artifact",
                "create_gallery", "edit_gallery", "delete_gallery",
                "create_timeline", "edit_timeline", "delete_timeline",
                "upload_media", "delete_media", "manage_categories"
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "role_name": "Editor",
            "description": "Edit content",
            "permissions": [
                "create_artifact", "edit_artifact",
                "create_gallery", "edit_gallery",
                "create_timeline", "edit_timeline",
                "upload_media"
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "role_name": "Viewer",
            "description": "View only access",
            "permissions": []
        }
    ]
    
    await db.roles.insert_many(roles)
    
    # Create admin user
    admin_role = roles[0]
    now = datetime.now(timezone.utc).isoformat()
    admin_user = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@museum.com",
        "password": hash_password("admin123"),
        "role_id": admin_role["id"],
        "status": "active",
        "last_login": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(admin_user)
    
    # Create default categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Military History", "description": "Weapons, armor, and military artifacts", "icon": "Sword", "display_order": 1, "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Manuscripts", "description": "Historical documents and writings", "icon": "BookOpen", "display_order": 2, "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Architecture", "description": "Architectural artifacts and models", "icon": "Building", "display_order": 3, "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Religious Artifacts", "description": "Items of religious significance", "icon": "Star", "display_order": 4, "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Art & Paintings", "description": "Fine art and historical paintings", "icon": "Palette", "display_order": 5, "created_at": now},
        {"id": str(uuid.uuid4()), "name": "Coins & Currency", "description": "Historical coins and currency", "icon": "Coins", "display_order": 6, "created_at": now}
    ]
    
    await db.categories.insert_many(categories)
    
    return {
        "message": "Database seeded successfully",
        "admin_email": "admin@museum.com",
        "admin_password": "admin123"
    }

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "HeritageOS API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(roles_router)
api_router.include_router(artifacts_router)
api_router.include_router(categories_router)
api_router.include_router(galleries_router)
api_router.include_router(timelines_router)
api_router.include_router(media_router)
api_router.include_router(sections_router)
api_router.include_router(dashboard_router)

app.include_router(api_router)

# Mount static files for uploads under /api/uploads for proper routing
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
