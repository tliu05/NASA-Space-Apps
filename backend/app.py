
import dash
from dash import dcc, html, Input, Output
import pandas as pd
import numpy as np
import networkx as nx
import plotly.graph_objects as go

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
metadata = pd.read_csv("database.csv")

# Create graph with thresholded edges
G = nx.Graph()
threshold = 0.5
num_nodes = sim_matrix.shape[0]

for i in range(num_nodes):
    G.add_node(i)

for i in range(num_nodes):
    for j in range(i + 1, num_nodes):
        weight = sim_matrix[i][j]
        if weight > threshold:
            G.add_edge(i, j, weight=weight)

# Layout
pos = nx.spring_layout(G, seed=42)

# Create figure
def create_figure(highlight_node=None, top_neighbors=None, force_edges=None):
    edge_x = []
    edge_y = []
    edge_colors = []

    for edge in G.edges(data=True):
        i, j = edge[0], edge[1]
        weight = edge[2]['weight']
        if force_edges and ((i, j) in force_edges or (j, i) in force_edges):
            color = 'orange'
        elif highlight_node is not None and (i == highlight_node or j == highlight_node):
            color = 'red'
        else:
            color = '#888'
        edge_x += [pos[i][0], pos[j][0], None]
        edge_y += [pos[i][1], pos[j][1], None]
        edge_colors.append(color)

    # Add forced edges (even if not in G)
    if force_edges:
        for i, j in force_edges:
            if not G.has_edge(i, j):
                edge_x += [pos[i][0], pos[j][0], None]
                edge_y += [pos[i][1], pos[j][1], None]
                edge_colors.append('orange')

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
        if node == highlight_node:
            node_text.append(f"{node}: {metadata.iloc[node]['Title']}")
            node_color.append('red')
        elif top_neighbors and node in top_neighbors:
            node_text.append(f"{node}: {metadata.iloc[node]['Title']}")
            node_color.append('orange')
        else:
            node_text.append("")
            node_color.append('blue')

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
                        title=dict(text='Interactive Similarity Graph', x=0.5),
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
    html.H2("Click a node to see top 5 similar articles"),
    dcc.Graph(id='graph', figure=create_figure(), style={'height': '800px'}),
    html.Div(id='info', style={'marginTop': '20px'})
])

@app.callback(
    Output('graph', 'figure'),
    Output('info', 'children'),
    Input('graph', 'clickData')
)
def update_graph(clickData):
    if clickData is None:
        return create_figure(), "Click a node to see details."

    point = clickData['points'][0]
    node_id = int(point['pointIndex'])

    # Get top 5 similar nodes (regardless of threshold)
    
    similarities = sim_matrix[:, node_id]  # Use the column instead of the row
    top_indices = np.argsort(similarities)[::-1]
    top_neighbors = [i for i in top_indices if i != node_id][:5]

    force_edges = [(node_id, i) for i in top_neighbors]

    # Info display
    info = []
    info.append(html.H4(f"Selected Node: {metadata.iloc[node_id]['Title']}"))
    info.append(html.A("Link", href=metadata.iloc[node_id]['Link'], target="_blank"))
    info.append(html.H5("Top 5 Similar Articles:"))
    for idx in top_neighbors:
        info.append(html.P([
            html.Strong(metadata.iloc[idx]['Title']),
            html.Br(),
            html.A("Link", href=metadata.iloc[idx]['Link'], target="_blank")
        ]))

    return create_figure(highlight_node=node_id, top_neighbors=top_neighbors, force_edges=force_edges), info

if __name__ == '__main__':
    app.run(debug=True)
