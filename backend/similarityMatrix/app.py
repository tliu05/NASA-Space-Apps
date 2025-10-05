import dash
from dash import dcc, html, Input, Output
import pandas as pd
import numpy as np
import networkx as nx
import plotly.graph_objects as go
from sklearn.cluster import KMeans
from flask import jsonify, request

# Load similarity matrix
df = pd.read_csv("similarity_matrix.csv", header=None)
if not pd.api.types.is_numeric_dtype(df.iloc[:, 0]):
    df = df.drop(columns=[0])
rows, cols = df.shape
if rows != cols:
    min_dim = min(rows, cols)
    df = df.iloc[:min_dim, :min_dim]
sim_matrix = df.to_numpy()

# Load metadata
metadata = pd.read_csv("../database.csv")

# Create graph with thresholded edges
G = nx.Graph()
threshold = 0
num_nodes = sim_matrix.shape[0]

for i in range(num_nodes):
    G.add_node(i)

for i in range(num_nodes):
    for j in range(i + 1, num_nodes):
        weight = sim_matrix[i][j]
        if weight > threshold:
            G.add_edge(i, j, weight=weight)

# Apply KMeans clustering
n_clusters = 6  # You can adjust this number
kmeans = KMeans(n_clusters=n_clusters, random_state=42)
kmeans.fit(sim_matrix)
labels = kmeans.labels_

# Map cluster IDs to colors
unique_clusters = list(set(labels))
cluster_color_map = {cluster: f"hsl({(i * 360 / len(unique_clusters)) % 360}, 70%, 50%)" for i, cluster in enumerate(unique_clusters)}

# Layout
pos = nx.spring_layout(G, seed=42)

# Create figure
def create_figure(highlight_node=None, top_neighbors=None, force_edges=None):
    edge_x = []
    edge_y = []
    edge_colors = []

    draw_threshold = 0.9
    selected_cluster = labels[highlight_node] if highlight_node is not None else None

    for edge in G.edges(data=True):
        i, j = edge[0], edge[1]
        weight = edge[2]['weight']
        same_cluster = (labels[i] == selected_cluster and labels[j] == selected_cluster)
        if weight > draw_threshold or (force_edges and ((i, j) in force_edges or (j, i) in force_edges)):
            x0, y0 = pos[i]
            x1, y1 = pos[j]
            edge_x += [x0, x1, None]
            edge_y += [y0, y1, None]
            if force_edges and ((i, j) in force_edges or (j, i) in force_edges):
                edge_colors.append('orange')
            else:
                edge_colors.append('#888' if not same_cluster else '#000')

    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        line=dict(width=1, color='#888'),
        hoverinfo='none',
        mode='lines'
    )

    node_x = []
    node_y = []
    node_text = []
    node_color = []

    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
        cluster_id = labels[node]
        base_color = cluster_color_map.get(cluster_id, '#000')
        in_selected_cluster = (selected_cluster is None or cluster_id == selected_cluster)

        if node == highlight_node:
            node_color.append('red')
            node_text.append(f"{node}: {metadata.iloc[node]['Title']}")
        elif top_neighbors and node in top_neighbors:
            node_color.append('orange')
            node_text.append(f"{node}: {metadata.iloc[node]['Title']}")
        else:
            node_color.append(base_color if in_selected_cluster else '#ccc')
            node_text.append("")  # Hide label unless clicked

    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode='markers+text',
        text=node_text,
        textposition="top center",
        hoverinfo='text',
        marker=dict(
            color=node_color,
            size=10,
            line_width=2
        )
    )

    fig = go.Figure(data=[edge_trace, node_trace],
                    layout=go.Layout(
                        title=dict(text='Interactive Similarity Graph (KMeans)', x=0.5),
                        showlegend=False,
                        hovermode='closest',
                        margin=dict(b=20, l=5, r=5, t=40),
                        xaxis=dict(showgrid=False, zeroline=False),
                        yaxis=dict(showgrid=False, zeroline=False)
                    ))
    return fig


# Dash app
app = dash.Dash(__name__)
app.layout = html.Div([
    # html.H2("Click a node to see top 5 similar articles"),
    dcc.Graph(id='graph', figure=create_figure(), style={'height': '800px'}),
    html.Div(id='info', style={'marginTop': '20px'})
])

@app.callback(
    Output('graph', 'figure'),
    Output('info', 'children'),
    Input('graph', 'clickData')
)
def update_graph(clickData):
    # if clickData is None:
    #     return create_figure(), "Click a node to see details."
    point = clickData['points'][0]
    node_id = int(point['pointIndex'])
    similarities = sim_matrix[:, node_id]
    top_indices = np.argsort(similarities)[::-1]
    top_neighbors = [i for i in top_indices if i != node_id][:5]
    force_edges = [(node_id, i) for i in top_neighbors]

    info = []
    # info.append(html.H4(f"Selected Node: {metadata.iloc[node_id]['Title']}"))
    # info.append(html.A("Link", href=metadata.iloc[node_id]['Link'], target="_blank"))
    # info.append(html.H5("Top 5 Similar Articles:"))
    # for idx in top_neighbors:
    #     info.append(html.P([
    #         html.Strong(metadata.iloc[idx]['Title']),
    #         html.Br(),
    #         html.A("Link", href=metadata.iloc[idx]['Link'], target="_blank")
    #     ]))
    #     pass

    return create_figure(highlight_node=node_id, top_neighbors=top_neighbors, force_edges=force_edges), info




@app.server.route('/api/top_neighbors', methods=['GET'])
def get_top_neighbors():
    node_id = int(request.args.get('node_id', -1))
    if node_id < 0 or node_id >= sim_matrix.shape[0]:
        return jsonify({'error': 'Invalid node_id'}), 400

    similarities = sim_matrix[:, node_id]
    top_indices = np.argsort(similarities)[::-1]
    top_neighbors = [int(i) for i in top_indices if i != node_id][:5]

    # Return metadata for top neighbors
    neighbors_data = []
    for idx in top_neighbors:
        neighbors_data.append({
            'id': int(idx),
            'title': metadata.iloc[idx]['Title'],
            'link': metadata.iloc[idx]['Link'],
            'keywords': str(metadata.iloc[idx]['Keywords']).split(',') if 'Keywords' in metadata.columns else []
        })
    return jsonify({'top_neighbors': neighbors_data})















if __name__ == '__main__':
    app.run(debug=True)
