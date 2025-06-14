from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Additional Models
class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    full_name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StudentCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class StudentWork(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudentWorkCreate(BaseModel):
    title: str
    content: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_student(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    student = await db.students.find_one({"username": token_data.username})
    if student is None:
        raise credentials_exception
    return Student(**student)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Authentication endpoints
@api_router.post("/register", response_model=Student)
async def register_student(student: StudentCreate):
    # Check if username or email already exists
    if await db.students.find_one({"$or": [{"username": student.username}, {"email": student.email}]}):
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    student_dict = student.dict()
    student_dict["hashed_password"] = get_password_hash(student.password)
    del student_dict["password"]
    
    new_student = Student(**student_dict)
    await db.students.insert_one(new_student.dict())
    return new_student

@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    student = await db.students.find_one({"username": form_data.username})
    if not student or not verify_password(form_data.password, student["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": student["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Student work endpoints
@api_router.post("/works", response_model=StudentWork)
async def create_student_work(
    work: StudentWorkCreate,
    current_student: Student = Depends(get_current_student)
):
    work_dict = work.dict()
    work_dict["student_id"] = current_student.id
    new_work = StudentWork(**work_dict)
    await db.student_works.insert_one(new_work.dict())
    return new_work

@api_router.get("/works", response_model=List[StudentWork])
async def get_student_works(current_student: Student = Depends(get_current_student)):
    works = await db.student_works.find({"student_id": current_student.id}).to_list(1000)
    return [StudentWork(**work) for work in works]

@api_router.get("/works/{work_id}", response_model=StudentWork)
async def get_student_work(
    work_id: str,
    current_student: Student = Depends(get_current_student)
):
    work = await db.student_works.find_one({
        "id": work_id,
        "student_id": current_student.id
    })
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return StudentWork(**work)

@api_router.put("/works/{work_id}", response_model=StudentWork)
async def update_student_work(
    work_id: str,
    work_update: StudentWorkCreate,
    current_student: Student = Depends(get_current_student)
):
    work = await db.student_works.find_one({
        "id": work_id,
        "student_id": current_student.id
    })
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    update_data = work_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.student_works.update_one(
        {"id": work_id},
        {"$set": update_data}
    )
    
    updated_work = await db.student_works.find_one({"id": work_id})
    return StudentWork(**updated_work)

@api_router.delete("/works/{work_id}")
async def delete_student_work(
    work_id: str,
    current_student: Student = Depends(get_current_student)
):
    result = await db.student_works.delete_one({
        "id": work_id,
        "student_id": current_student.id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Work not found")
    return {"message": "Work deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
