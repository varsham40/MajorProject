import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI HealthSecure"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "ai_healthsecure_super_secret_jwt_key_2026_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database URL - default to async SQLite for zero-config local execution, overridable via ENV to asyncpg PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_healthsecure.db"
    
    # Hardhat / Web3 settings
    HARDHAT_RPC_URL: str = "http://127.0.0.1:8545"
    HARDHAT_CHAIN_ID: int = 31337
    # Default private key from Hardhat account #0
    BLOCKCHAIN_PRIVATE_KEY: str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    
    # Uploads directory
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "medical_reports"))
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
