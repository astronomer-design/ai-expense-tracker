import forecasting
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
import schemas
import ai_services
import ml_models
import analytics  # <-- We brought your new Analytics Brain into the main app!
import chatbot
from database import engine, SessionLocal

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Expense Tracker API",
    description="Backend API for managing transactions, budgets, and AI insights.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all connections (perfect for local testing)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "API is live and ready!"}

# --- USER ENDPOINTS ---

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(name=user.name, email=user.email, hashed_password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=list[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

# --- TRANSACTION ENDPOINTS ---

@app.post("/transactions/", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_transaction = models.Transaction(
        amount=transaction.amount,
        category=transaction.category,
        description=transaction.description,
        owner_id=user_id
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@app.get("/transactions/{user_id}", response_model=list[schemas.TransactionResponse])
def read_transactions(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(models.Transaction.owner_id == user_id).offset(skip).limit(limit).all()
    return transactions

# --- AI & OCR ENDPOINTS ---

@app.post("/upload-receipt/")
async def upload_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(status_code=400, detail="File must be an image or PDF")
    
    image_content = await file.read()
    
    extracted_data = ai_services.process_receipt_image(image_content)
    
    merchant_name = extracted_data.get("merchant", "Unknown")
    predicted_category = ml_models.predict_category(merchant_name)
    
    extracted_data["predicted_category"] = predicted_category
    
    return {"filename": file.filename, "ai_extracted_data": extracted_data}

# --- DASHBOARD & ANALYTICS ENDPOINTS ---

@app.get("/users/{user_id}/dashboard")
def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    # 1. Verify the user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Grab all of their transactions from the database
    transactions = db.query(models.Transaction).filter(models.Transaction.owner_id == user_id).all()
    
    # 3. Pass the data to the Analytics engine to do the math
    dashboard_data = analytics.generate_financial_summary(transactions)
    
    return dashboard_data

@app.get("/users/{user_id}/chat")
def chat_with_ai(user_id: int, query: str, db: Session = Depends(get_db)):
    # 1. Grab the user's latest dashboard data
    transactions = db.query(models.Transaction).filter(models.Transaction.owner_id == user_id).all()
    dashboard_data = analytics.generate_financial_summary(transactions)

    # 2. Send their question and data to the AI
    ai_response = chatbot.ask_financial_assistant(query, dashboard_data)

    return {"response": ai_response}

@app.get("/users/{user_id}/forecast")
def get_user_forecast(user_id: int, db: Session = Depends(get_db)):
    # 1. Grab their current data
    transactions = db.query(models.Transaction).filter(models.Transaction.owner_id == user_id).all()
    dashboard_data = analytics.generate_financial_summary(transactions)
    
    # 2. Run it through the predictive engine
    forecast = forecasting.generate_weekly_forecast(dashboard_data)
    
    return forecast