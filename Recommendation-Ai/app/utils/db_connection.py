from pymongo import MongoClient
import os

def get_db_connection():
    """
    Creates and returns a connection to the MongoDB database
    Uses environment variables or defaults to local MongoDB instance
    """
    # Get MongoDB connection string from environment variable or use default
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    
    # Create MongoDB client
    client = MongoClient(mongo_uri)
    
    # Return TuniHire database
    return client.TuniHire
