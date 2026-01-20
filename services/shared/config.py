"""
ClassPilot AI - Shared Configuration
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

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
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
