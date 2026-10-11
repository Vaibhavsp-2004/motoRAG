import pandas as pd

CSV_FILE = "data/processed/ice_motorcycles.csv"

df = pd.read_csv(CSV_FILE)

print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nColumns and data types:\n")

for column in df.columns:
    print(f"{column:35} {df[column].dtype}")

print("\nFirst row:\n")
print(df.iloc[0])