from sqlalchemy import text
from database import engine

with engine.connect() as connection:
    result = connection.execute(
        text("SELECT COUNT(*) FROM motorcycles")
    )

    count = result.scalar()

    print(f"Motorcycles in database: {count}")