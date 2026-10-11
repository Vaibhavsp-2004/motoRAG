import pandas as pd

from database import engine, Motorcycle


CSV_FILE = "data/processed/ice_motorcycles.csv"


df = pd.read_csv(CSV_FILE)

print(f"Loaded {len(df)} motorcycles.")

print("\nMissing values:")
print(df.isna().sum())


print("\nImporting motorcycles...")

df.to_sql(
    "motorcycles",
    engine,
    if_exists="append",
    index=False
)

print("\nImport completed successfully.")