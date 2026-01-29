#!/usr/bin/env python3
"""
Database initialization script for ClassPilot AI
Run this to set up the MySQL database schema
"""

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "sql304.infinityfree.com"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "if0_41003574"),
    "password": os.getenv("DB_PASSWORD", "K2Qcs8z6nhRMT"),
    "database": os.getenv("DB_NAME", "if0_41003574_classpilot"),
}


def init_database():
    """Initialize the database with schema"""
    print("🔄 Connecting to MySQL database...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print(f"✅ Connected to {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
        with open(schema_path, "r") as f:
            schema = f.read()
        
        # Execute each statement separately
        statements = [s.strip() for s in schema.split(";") if s.strip()]
        
        for i, statement in enumerate(statements):
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"   ✓ Statement {i+1}/{len(statements)} executed")
                except mysql.connector.Error as err:
                    if err.errno == 1065:  # Empty query
                        continue
                    print(f"   ⚠ Statement {i+1}: {err.msg}")
        
        conn.commit()
        print("\n✅ Database schema initialized successfully!")
        
        # Verify tables
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n📋 Tables created ({len(tables)}):")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"   • {table[0]} ({count} rows)")
        
        cursor.close()
        conn.close()
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ MySQL Error: {err}")
        return False
    except FileNotFoundError:
        print("❌ Schema file not found. Make sure schema.sql exists in database/")
        return False


def test_connection():
    """Test database connection"""
    print("🔄 Testing database connection...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        print("✅ Connection successful!")
        return True
    except mysql.connector.Error as err:
        print(f"❌ Connection failed: {err}")
        return False


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_connection()
    else:
        print("=" * 50)
        print("ClassPilot AI - Database Initialization")
        print("=" * 50)
        print()
        
        if test_connection():
            print()
            response = input("Initialize database schema? (y/N): ")
            if response.lower() == "y":
                init_database()
            else:
                print("Cancelled.")
        else:
            print("\nPlease check your database credentials in .env")
