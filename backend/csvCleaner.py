import pandas as pd
import os

# --- Paths ---
script_dir = os.path.dirname(os.path.abspath(__file__))
input_path = os.path.join(script_dir, "results.csv")
output_path = os.path.join(script_dir, "results_pruned.csv")

# Load results.csv
df = pd.read_csv(input_path)

columns_to_keep = ['Title', 'Link']
removed_columns = []

for col in df.columns:
    if col not in ['Title', 'Link']:
        # Convert column to numeric (coerce errors to NaN)
        numeric_col = pd.to_numeric(df[col], errors='coerce')
        if numeric_col.sum() != 0:
            columns_to_keep.append(col)
        else:
            removed_columns.append(col)

# Create pruned dataframe
df_pruned = df[columns_to_keep]

# Save pruned CSV
df_pruned.to_csv(output_path, index=False)

# Print removed columns
if removed_columns:
    print(f"✅ Removed columns (all zeros or non-numeric): {', '.join(removed_columns)}")
else:
    print("✅ No columns were removed; all keywords appear at least once.")

print(f"Pruned CSV saved to {output_path}")
