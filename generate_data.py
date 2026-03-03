import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Configuration for ~5MB file (approx 40,000 rows)
num_rows = 45000
output_file = "Global_SaaS_Forensic_Dataset.csv"

print(f"[SYSTEM] Generating {num_rows} rows of forensic SaaS data...")

# 1. Base Data Generation
data = {
    "Transaction_ID": [f"TXN-{100000 + i}" for i in range(num_rows)],
    "Date": [(datetime(2023, 1, 1) + timedelta(hours=random.randint(0, 24*1000))).strftime('%Y-%m-%d') for i in range(num_rows)],
    "Customer_Name": [random.choice(["Alpha Corp", "Delta Systems", "Nexus Ltd", "Sovereign Tech", "Omega Industries"]) for _ in range(num_rows)],
    "Region": [random.choice(["North America", "EMEA", "APAC", "LATAM"]) for _ in range(num_rows)],
    "Product_Category": [random.choice(["Cloud Storage", "AI Compute", "Cybersecurity", "Analytics Pro"]) for _ in range(num_rows)],
    "Plan_Type": [random.choice(["Basic", "Pro", "Enterprise", "Custom"]) for _ in range(num_rows)],
    "Revenue": np.random.uniform(500, 50000, size=num_rows).round(2),
    "Cost": np.random.uniform(200, 20000, size=num_rows).round(2),
    "Discount_Percent": np.random.choice([0, 5, 10, 15, 20], size=num_rows, p=[0.6, 0.1, 0.1, 0.1, 0.1])
}

df = pd.DataFrame(data)

# 2. Hard Math Logic (Profit = Revenue - Cost - (Revenue * Discount))
df['Profit'] = (df['Revenue'] - df['Cost'] - (df['Revenue'] * df['Discount_Percent'] / 100)).round(2)

# 3. SABOTAGE LAYER (The "Forensic Test")
# Let's mess up 2% of the data to test Agent 2 (Math Auditor)
sabotage_indices = random.sample(range(num_rows), int(num_rows * 0.02))
for idx in sabotage_indices:
    df.at[idx, 'Profit'] = df.at[idx, 'Profit'] + random.uniform(500, 1000) # Math Mismatch!

# Let's add 5 "Whale" Outliers to test Z-Score
for i in range(5):
    idx = random.randint(0, num_rows-1)
    df.at[idx, 'Revenue'] = 5000000 # $5M Deal (Massive Outlier)
    df.at[idx, 'Profit'] = 4500000

# 4. Save to CSV
df.to_csv(output_file, index=False)
print(f"✅ Success! '{output_file}' generated (Size: ~5.1 MB).")