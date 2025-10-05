import numpy as np
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
import os

# --- File paths (assume in same folder as script) ---
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, '..', "results_pruned.csv")                   # input CSV
matrixCSV_path = os.path.join(script_dir, "matrix.csv")                     # output CSV num 1
similarity_matrix_path = os.path.join(script_dir, "similarity_matrix.csv")  # output CSV num 2
full_graph_path = os.path.join(script_dir, "full_similarity_graph.html")    # output HTML

# Step 1: Read websites from CSV
df = pd.read_csv(csv_path)


def calculate_cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0  # Handle cases where a vector is zero
    return dot_product / (norm_vec1 * norm_vec2)

# Drop the first two columns ('Unnamed: 0' and 'Title') and keep columns from the third onwards
vectors = df.iloc[:, 3:].values.tolist()


# calculate similarity of each vector to each vector and save in matrix
similarity_matrix = np.zeros((len(vectors), len(vectors)))
# fill first row with indices

for i in range(len(vectors)):
    for j in range(len(vectors)):
        similarity_matrix[i][j] = calculate_cosine_similarity(vectors[i], vectors[j])
np.savetxt(similarity_matrix_path, similarity_matrix, delimiter=",")# save similarity matrix as csv
similarity_df = pd.DataFrame(similarity_matrix)
similarity_df.to_csv(matrixCSV_path, index=False)

# Load the similarity matrix from the CSV file without headers
similarity_matrix = pd.read_csv(similarity_matrix_path,header=None)
matrix = similarity_matrix.to_numpy()
