from pymongo import MongoClient
import os
import sys
from collections import defaultdict

class MockCollection:
    """Mock collection for testing without MongoDB connection"""
    def __init__(self, name):
        self.name = name
        self.data = []
    
    def find_one(self, query=None, *args, **kwargs):
        """Simple mock implementation of find_one"""
        if not self.data:
            return None
        
        if query is None:
            return self.data[0]
            
        # Very simple query matching
        for doc in self.data:
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                return doc
        return None
    
    def find(self, query=None, *args, **kwargs):
        """Simple mock implementation of find"""
        results = []
        
        if query is None:
            return self.data
            
        # Very simple query matching
        for doc in self.data:
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                results.append(doc)
        
        # Mock cursor with list() function
        results.list = lambda: results
        # Add limit function to the results list
        results.limit = lambda n: results[:n] if len(results) > n else results
        return results
    
    def insert_one(self, document):
        """Mock insert_one"""
        self.data.append(document)
        return type('obj', (object,), {'inserted_id': document.get('_id')})
        
    def insert_many(self, documents):
        """Mock insert_many"""
        for doc in documents:
            self.data.append(doc)
        return type('obj', (object,), {'inserted_ids': [doc.get('_id') for doc in documents]})
    
    def count_documents(self, query=None):
        """Mock count_documents"""
        if query is None:
            return len(self.data)
        
        count = 0
        for doc in self.data:
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                count += 1
        return count

class MockDatabase:
    """Mock database for testing without MongoDB connection"""
    def __init__(self):
        self.name = "TuniHire_Mock"
        self._collections = defaultdict(lambda: MockCollection(name="unknown"))
        
        # Create standard collections
        self._collections["users"] = MockCollection(name="users")
        self._collections["portfolios"] = MockCollection(name="portfolios")
        self._collections["jobposts"] = MockCollection(name="jobposts")
        self._collections["applications"] = MockCollection(name="applications")
        self._collections["companies"] = MockCollection(name="companies")
    
    def __getattr__(self, name):
        """Allow attribute access for collection names"""
        return self._collections[name]
    
    def list_collection_names(self):
        """Return list of collection names"""
        return list(self._collections.keys())

def create_mock_db():
    """Create a mock database for testing"""
    print("Using mock database for testing")
    return MockDatabase()

def get_db_connection():
    """
    Creates and returns a connection to the MongoDB database
    Uses environment variables or defaults to local MongoDB instance
    """
    try:
        # Get MongoDB connection string from environment variable or use default
        mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
        
        # Create MongoDB client with a timeout
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Verify connection by getting server info
        client.server_info()
        
        # Return TuniHire database
        return client.TuniHire
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        print("Ensure MongoDB is running and accessible.")
        # Return a mock database for testing if real DB connection fails
        return create_mock_db()
