from pymongo import MongoClient
from pymongo.database import Database

def get_db() -> Database:
    client = MongoClient("mongodb://localhost:27017")
    db = client["nutripk"]
    return db
