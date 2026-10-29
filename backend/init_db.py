from src.models.database import Base, engine
print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
