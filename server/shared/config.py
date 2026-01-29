"""
ClassPilot AI - Shared Configuration
Enhanced configuration with database and all service settings
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional, List
from dotenv import load_dotenv

# Load .env from server directory
load_dotenv()


class Settings(BaseSettings):
    # ASR Configuration
    whisper_model: str = "small.en"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    chunk_duration: float = 0.3
    vad_threshold: float = 0.5
    
    # RAG Configuration
    embedding_model: str = "all-MiniLM-L6-v2"
    chroma_persist_dir: str = "./data/vectors"
    max_context_length: int = 4000
    
    # LLM Configuration
    ollama_host: str = "http://localhost:11434"
    llm_model: str = "llama3.2"
    openai_api_key: str = ""
    
    # Database Configuration
    db_host: str = "sql304.infinityfree.com"
    db_port: int = 3306
    db_user: str = "if0_41003574"
    db_password: str = "K2Qcs8z6nhRMT"
    db_name: str = "if0_41003574_classpilot"
    db_pool_size: int = 5
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # File Storage
    upload_dir: str = "./data/uploads"
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    
    class Config:
        env_file = ".env"
        extra = "ignore"
    
    @property
    def database_url(self) -> str:
        return f"mysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins from environment or defaults"""
        origins_str = os.getenv("CORS_ORIGINS", "")
        if origins_str:
            return [o.strip() for o in origins_str.split(",")]
        return [
            "http://localhost:3000", 
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "https://classpilot.42web.io"
        ]


settings = Settings()

# Create required directories
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.chroma_persist_dir, exist_ok=True)
