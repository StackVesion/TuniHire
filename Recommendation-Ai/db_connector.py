import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class MockCollection:
    """Mock collection for testing when MongoDB is unavailable"""
    def __init__(self, name):
        self.name = name
        self.data = []
        
    def find(self, query=None):
        return self.data
        
    def find_one(self, query=None):
        return self.data[0] if self.data else None
        
    def insert_one(self, doc):
        self.data.append(doc)
        
    def insert_many(self, docs):
        self.data.extend(docs)
        
    def count_documents(self, query=None):
        return len(self.data)
        
    def delete_many(self, query=None):
        self.data = []

class MockDatabase:
    """Mock database for testing when MongoDB is unavailable"""
    def __init__(self, name="MockMongoDB"):
        self.name = name
        self.collections = {}
        
    def __getitem__(self, collection_name):
        if collection_name not in self.collections:
            self.collections[collection_name] = MockCollection(collection_name)
        return self.collections[collection_name]
        
    def __getattr__(self, collection_name):
        return self[collection_name]
        
    def list_collection_names(self):
        return list(self.collections.keys())

def get_db_connection():
    """Get MongoDB connection or fallback to mock DB for local development/testing"""
    # Try to connect to MongoDB
    try:
        # Check for MongoDB URI in environment variables
        mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        logger.info("Connected to MongoDB successfully")
        
        # Return TuniHire database
        return client.TuniHire
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {str(e)}")
        logger.warning("Using mock database for local development/testing")
        
        # Return mock database for local development/testing
        return MockDatabase("TuniHire")
