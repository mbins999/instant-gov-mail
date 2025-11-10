from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ClickHouse Configuration
    CLICKHOUSE_HOST: str = "192.168.203.134"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_DATABASE: str = "moi"
    CLICKHOUSE_USERNAME: str = "moi"
    CLICKHOUSE_PASSWORD: str = "password123"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 3001
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    SESSION_EXPIRE_DAYS: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
