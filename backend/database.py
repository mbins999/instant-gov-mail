import clickhouse_connect
from config import settings

def get_client():
    """Create and return a ClickHouse client"""
    client = clickhouse_connect.get_client(
        host=settings.CLICKHOUSE_HOST,
        port=settings.CLICKHOUSE_PORT,
        username=settings.CLICKHOUSE_USERNAME,
        password=settings.CLICKHOUSE_PASSWORD,
        database=settings.CLICKHOUSE_DATABASE
    )
    return client

def init_database():
    """Initialize database and create tables if they don't exist"""
    client = get_client()
    
    # Create database if not exists
    client.command(f"CREATE DATABASE IF NOT EXISTS {settings.CLICKHOUSE_DATABASE}")
    
    print(f"✓ Database '{settings.CLICKHOUSE_DATABASE}' initialized")
    return client
