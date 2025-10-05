
import pandas as pd
import numpy as np
from collections import Counter

# Load similarity matrix
df = pd.read_csv("similarity_matrix.csv", header=None)
if not pd.api.types.is_numeric_dtype(df.iloc[:, 0]):
    df = df.drop(columns=[0])
sim_matrix = df.to_numpy()

# Count how often each node appears in the top 5 of any column
top_k = 5
num_nodes = sim_matrix.shape[0]
top_counts = Counter()

for col in range(num_nodes):
    similarities = sim_matrix[:, col]
    top_indices = np.argsort(similarities)[::-1]
    top_neighbors = [i for i in top_indices if i != col][:top_k]
    top_counts.update(top_neighbors)

# Show most frequently appearing nodes
print("Most frequently appearing nodes in top 5 similar columns:")
for node, count in top_counts.most_common(10):
    print(f"Node {node}: {count} times")
