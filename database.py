from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Local SQLite file for development
SQLALCHEMY_DATABASE_URL = "sqlite:///./expense_tracker.db"

# Create the engine to talk to the database
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Set up a session factory for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that our future tables will inherit from
Base = declarative_base()