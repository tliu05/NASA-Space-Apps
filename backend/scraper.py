import os
import pandas as pd
import requests
from bs4 import BeautifulSoup

# --- File paths (assume in same folder as script) ---
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "database.csv")       # input CSV
keywords_path = os.path.join(script_dir, "keywords.txt")  # keywords file
output_path = os.path.join(script_dir, "results.csv")     # output CSV

# Step 1: Read websites from CSV
df = pd.read_csv(csv_path)

# Step 2: Read keywords
with open(keywords_path, "r", encoding="utf-8") as f:
    keywords = [line.strip().lower() for line in f if line.strip()]

results = []

# Step 3: Fetch via NCBI E-utilities API
for _, row in df.iterrows():
    title = row['Title']
    link = row['Link']

    # Extract PMCID (the part after last slash, e.g. PMC4136787)
    try:
        pmcid = link.rstrip("/").split("/")[-1]

        api_url = (
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            f"?db=pmc&id={pmcid}&rettype=full&retmode=xml"
        )

        response = requests.get(api_url, timeout=15)
        response.raise_for_status()

        # Parse XML → plain text
        soup = BeautifulSoup(response.text, "xml")
        text = soup.get_text(" ", strip=True).lower()

        # Binary presence for each keyword
        keyword_hits = {kw: (1 if kw in text else 0) for kw in keywords}

        row_result = {"Title": title, "Link": link}
        row_result.update(keyword_hits)
        results.append(row_result)

    except Exception as e:
        results.append({"Title": title, "Link": link, "Error": str(e)})

# Step 4: Save results
output_df = pd.DataFrame(results)
output_df.to_csv(output_path, index=False)

print(f"✅ Done! Results saved to {output_path}")
