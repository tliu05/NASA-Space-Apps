import numpy as np
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
import os

# --- File paths (assume in same folder as script) ---
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "results_pruned.csv")           # input CSV
output_path = os.path.join(script_dir, "matrix.csv")     # output CSV

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
np.savetxt("similarity_matrix.csv", similarity_matrix, delimiter=",")# save similarity matrix as csv
similarity_df = pd.DataFrame(similarity_matrix)
similarity_df.to_csv(output_path, index=False)

# Load the similarity matrix from the CSV file without headers
similarity_matrix = pd.read_csv("similarity_matrix.csv",header=None)
matrix = similarity_matrix.to_numpy()

# # Create a graph from the similarity matrix
# G = nx.Graph()

# # Add nodes
# num_nodes = matrix.shape[0]
# for i in range(num_nodes):
#     G.add_node(i)

# # Add edges with weights (similarity values)
# for i in range(num_nodes):
#     for j in range(num_nodes):
#         if i != j:
#             weight = matrix[i][j]
#             G.add_edge(i, j, weight=weight)

# # Generate positions for nodes using spring layout
# pos = nx.spring_layout(G, seed=42)

# # Create edge traces with thickness proportional to similarity
# edge_x = []
# edge_y = []
# for edge in G.edges(data=True):
#     x0, y0 = pos[edge[0]]
#     x1, y1 = pos[edge[1]]
#     edge_x += [x0, x1, None]
#     edge_y += [y0, y1, None]

# edge_trace = go.Scatter(
#     x=edge_x,
#     y=edge_y,
#     line=dict(width=1, color='#888'),
#     hoverinfo='none',
#     mode='lines'
# )

# # Create node traces
# node_x = []
# node_y = []
# node_text = []
# for node in G.nodes():
#     x, y = pos[node]
#     node_x.append(x)
#     node_y.append(y)
#     node_text.append(f'Node {node}')

# node_trace = go.Scatter(
#     x=node_x,
#     y=node_y,
#     mode='markers+text',
#     text=node_text,
#     textposition="top center",
#     marker=dict(
#         showscale=False,
#         color='blue',
#         size=10,
#         line_width=2
#     )
# )

# # Create the figure with corrected layout
# fig = go.Figure(data=[edge_trace, node_trace],
#                 layout=go.Layout(
#                     title=dict(text='Graph from Similarity Matrix', font=dict(size=16)),
#                     showlegend=False,
#                     hovermode='closest',
#                     margin=dict(b=20, l=5, r=5, t=40),
#                     xaxis=dict(showgrid=False, zeroline=False),
#                     yaxis=dict(showgrid=False, zeroline=False)
#                 ))

# # Save the plot as JSON and PNG files
# fig.write_json("similarity_graph.json")
# fig.write_image("similarity_graph.png")


import pandas as pd
import networkx as nx
import plotly.graph_objects as go

# Load the full similarity matrix
df = pd.read_csv("similarity_matrix.csv", header=None)

# Drop the first column if it's an index or non-numeric
if not pd.api.types.is_numeric_dtype(df.iloc[:, 0]):
    df = df.drop(columns=[0])

# Ensure it's a square matrix
if df.shape[0] != df.shape[1]:
    raise ValueError("The similarity matrix must be square.")

# Create the graph
G = nx.Graph()
num_nodes = df.shape[0]

# Add nodes
for i in range(num_nodes):
    G.add_node(i)

# Add edges with weights (skip self-loops)
for i in range(num_nodes):
    for j in range(i + 1, num_nodes):
        weight = df.iat[i, j]
        if weight > .75:  # Optional: filter out low similarities
            G.add_edge(i, j, weight=weight)

# Generate positions for nodes
pos = nx.spring_layout(G, seed=42)

# Create edge traces
edge_x = []
edge_y = []
for edge in G.edges(data=True):
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x += [x0, x1, None]
    edge_y += [y0, y1, None]

edge_trace = go.Scatter(
    x=edge_x,
    y=edge_y,
    line=dict(width=1, color='#888'),
    hoverinfo='none',
    mode='lines'
)

# Create node traces
node_x = []
node_y = []
node_text = []

for node in G.nodes():
    x, y = pos[node]
    node_x.append(x)
    node_y.append(y)
    node_text.append(f'Node {node}')
node_trace = go.Scatter(
    x=node_x,
    y=node_y,
    mode='markers+text',
    text=node_text,
    textposition="top center",
    marker=dict(
        showscale=False,
        color='blue',
        size=10,
        line_width=2
    )
)


# Create the figure
fig = go.Figure(data=[edge_trace, node_trace],
                layout=go.Layout(
                    title=dict(text='Full Similarity Graph', x=0.5),
                    showlegend=False,
                    hovermode='closest',
                    margin=dict(b=20, l=5, r=5, t=40),
                    xaxis=dict(showgrid=False, zeroline=False),
                    yaxis=dict(showgrid=False, zeroline=False)
                ))

# Save the interactive graph
fig.write_html("full_similarity_graph.html")
print("Graph saved as 'full_similarity_graph.html'")
