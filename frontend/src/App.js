// brady was here
import React, { useState, useMemo } from 'react';
import { Search, Filter, MessageSquare, TrendingUp, BookOpen, Beaker, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './App.css';

// Fake Data ----------------------------------------------------------------------------------------------
const mockPublications = [
  {
    id: 1,
    title: "Effects of Microgravity on Plant Root Development in Arabidopsis thaliana",
    authors: "Johnson, M., Smith, K., Lee, R.",
    year: 2023,
    organism: "Plants",
    topic: "Plant Biology",
    conditions: ["Microgravity"],
    abstract: "This study investigated how microgravity affects root gravitropism in Arabidopsis. Results showed altered gene expression in root cells...",
    citations: 45,
    keywords: ["arabidopsis", "roots", "microgravity", "gravitropism"]
  },
  {
    id: 2,
    title: "Bone Density Loss in Long-Duration Spaceflight: A 12-Month ISS Study",
    authors: "Chen, L., Rodriguez, A., Williams, T.",
    year: 2022,
    organism: "Humans",
    topic: "Human Physiology",
    conditions: ["Microgravity", "Long Duration"],
    abstract: "Astronauts on 12-month missions experienced 1.5% bone density loss per month despite exercise countermeasures...",
    citations: 128,
    keywords: ["bone density", "astronauts", "ISS", "countermeasures"]
  },
  {
    id: 3,
    title: "Radiation Effects on Microbial Communities in Space Environment",
    authors: "Patel, S., O'Brien, M.",
    year: 2024,
    organism: "Microbes",
    topic: "Microbiology",
    conditions: ["Radiation", "Microgravity"],
    abstract: "Study of bacterial communities exposed to cosmic radiation shows increased mutation rates but also adaptive resistance mechanisms...",
    citations: 32,
    keywords: ["bacteria", "radiation", "mutations", "adaptation"]
  },
  {
    id: 4,
    title: "Wheat Growth Optimization for Martian Greenhouse Conditions",
    authors: "Anderson, K., Zhang, W., Murphy, D.",
    year: 2023,
    organism: "Plants",
    topic: "Plant Biology",
    conditions: ["Low Pressure", "CO2 Enrichment"],
    abstract: "Wheat cultivars tested under Mars-analog conditions show promising yields with modified atmospheric pressure and CO2 levels...",
    citations: 67,
    keywords: ["wheat", "mars", "greenhouse", "crop production"]
  },
  {
    id: 5,
    title: "Immune System Response to Spaceflight: A Meta-Analysis",
    authors: "Thompson, E., Garcia, R., Kumar, V.",
    year: 2022,
    organism: "Humans",
    topic: "Human Physiology",
    conditions: ["Microgravity", "Radiation"],
    abstract: "Comprehensive analysis of 50 studies reveals consistent patterns of immune dysregulation during spaceflight...",
    citations: 156,
    keywords: ["immune system", "spaceflight", "meta-analysis"]
  },
  {
    id: 6,
    title: "C. elegans Muscle Atrophy Models for Understanding Human Sarcopenia",
    authors: "Liu, Y., Brown, A.",
    year: 2021,
    organism: "Other",
    topic: "Model Organisms",
    conditions: ["Microgravity"],
    abstract: "Nematode models demonstrate similar muscle wasting pathways as humans in microgravity environments...",
    citations: 89,
    keywords: ["c elegans", "muscle", "atrophy", "model organism"]
  }
];

// Generate more mock data for visualizations
const yearlyData = [
  { year: 2019, count: 45 },
  { year: 2020, count: 58 },
  { year: 2021, count: 72 },
  { year: 2022, count: 95 },
  { year: 2023, count: 118 },
  { year: 2024, count: 220 }
];

const topicData = [
  { name: 'Plant Biology', value: 182, color: '#10b981' },
  { name: 'Human Physiology', value: 156, color: '#3b82f6' },
  { name: 'Microbiology', value: 124, color: '#f59e0b' },
  { name: 'Model Organisms', value: 89, color: '#8b5cf6' },
  { name: 'Other', value: 57, color: '#6b7280' }
];
// ========================================================================================================


// Main App Component -------------------------------------------------------------------------------------
function App() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrganism, setSelectedOrganism] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);

    // Filter publications -------------------------------------------------------------------
    const filteredPublications = useMemo(() => {
    return mockPublications.filter(pub => {
        const matchesSearch = searchQuery === '' ||
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesOrganism = selectedOrganism === 'All' || pub.organism === selectedOrganism;
        const matchesYear = selectedYear === 'All' || pub.year.toString() === selectedYear;
        const matchesTopic = selectedTopic === 'All' || pub.topic === selectedTopic;

        return matchesSearch && matchesOrganism && matchesYear && matchesTopic;
    });
    }, [searchQuery, selectedOrganism, selectedYear, selectedTopic]);
    // ---------------------------------------------------------------------------------------


    // AI Chat function using Claude API -----------------------------------------------------
    const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
        // Build context from publications
        const publicationsContext = mockPublications.map(pub =>
        `Title: ${pub.title}\nAuthors: ${pub.authors}\nYear: ${pub.year}\nAbstract: ${pub.abstract}\n`
        ).join('\n---\n');

        const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY, 
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            messages: [
            {
                role: "user",
                content: `You are an AI assistant helping scientists explore NASA space biology research.
                        Based on the following publications, answer the user's question.
                        Publications:
                        ${publicationsContext}
                        User Question: ${chatInput}`
            }
            ]
        })
        });

        const data = await response.json();
        const assistantMessage = {
        role: 'assistant',
        content: data.content?.[0]?.text || "Sorry, I couldn't parse a response."
        };

        setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        console.error('Chat error:', error);
        setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
        }]);
    } finally {
        setIsLoading(false);
    }
    };
    // ---------------------------------------------------------------------------------------

    // Filter options
    const organisms = ['All', 'Plants', 'Humans', 'Microbes', 'Other'];
    const years = ['All', '2024', '2023', '2022', '2021', '2020', '2019'];
    const topics = ['All', 'Plant Biology', 'Human Physiology', 'Microbiology', 'Model Organisms'];

    // Main render
	return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="header-inner">
                    <div className="header-left">
                        <div>
                            <h1 className="header-title">NASA Space Biology Knowledge Engine</h1>
                            <p className="header-subtitle">Exploring 608 Publications</p>
                        </div>
                    </div>
                    <button onClick={() => setShowChat(!showChat)} className="btn">
                        <MessageSquare className="icon" />
                        AI Assistant
                    </button>
                </div>
            </header>

            <div className="main-content">
                {/* Stats Overview */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">608</div>
                        <div className="stat-label">Total Publications</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value text-green">182</div>
                        <div className="stat-label">Plant Studies</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value text-purple">156</div>
                        <div className="stat-label">Human Studies</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value text-orange">2019–2024</div>
                        <div className="stat-label">Year Range</div>
                    </div>
                </div>

                {/* Visualizations */}
                <div className="viz-grid">
                    {/* Graph over time ----------------------------------------------- */}
                    <div className="viz-card">
                        <h3 className="viz-title">
                            {/* <TrendingUp className="icon" /> */}
                            Publications Over Time
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={yearlyData}>
                                <CartesianGrid strokeDasharray="3 3" className="chart-grid" />
                                <XAxis dataKey="year" className="chart-axis" />
                                <YAxis className="chart-axis" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }} />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* --------------------------------------------------------------- */}

                    {/* Pie Graph ----------------------------------------------------- */}
                    <div className="viz-card">
                        <h3 className="viz-title">Research Topics</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={topicData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    >
                                    {topicData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#2F406E', border: '1px solid #3b82f6' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* --------------------------------------------------------------- */}
                </div>

                {/* Search + Filters */}
                <div className="filter-panel">
                    <div className="filter-row">
                        <div className="search-box">
                            <Search className="search-icon" />
                            <input	type="text" placeholder="Search publications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"/>
                        </div>

                        <div className="filter-selects">
                            <select value={selectedOrganism} onChange={(e) => setSelectedOrganism(e.target.value)} className="filter-select">
                                {organisms.map(org => (
                                    <option key={org} value={org}>{org}</option>
                                ))}
                            </select>

                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="filter-select">
                                {topics.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="filter-count">
                        Showing {filteredPublications.length} of {mockPublications.length} publications
                    </div>
                </div>

                {/* Publications List */}
                <div className="pub-list">
                    {filteredPublications.map(pub => (
                    <div key={pub.id} className="publication-card" onClick={() => setSelectedPaper(pub)}>
                        <div className="pub-header">
                            <h3 className="publication-title">{pub.title}</h3>
                            <span className="pub-year">{pub.year}</span>
                        </div>

                        <p className="publication-meta">{pub.authors}</p>
                        <p className="publication-abstract">{pub.abstract}</p>

                        <div className="pub-tags">
                            <span className="tag tag-green">{pub.organism}</span>
                            <span className="tag tag-purple">{pub.topic}</span>
                            {pub.conditions.map(cond => (
                                <span key={cond} className="tag tag-orange">{cond}</span>
                            ))}
                        </div>

                        <div className="pub-extra">
                            {pub.citations} citations • Keywords: {pub.keywords.join(', ')}
                        </div>
                    </div>
                    ))}
                </div>
            </div>

            {/* AI Chat Panel */}
            {showChat && (
            <div className="chat-panel">
                <div className="chat-header">
                    <h3>
                        <MessageSquare className="icon" /> AI Research Assistant
                    </h3>
                    <button onClick={() => setShowChat(false)} className="close-btn">
                        <X className="icon" />
                    </button>
                </div>

                <div className="chat-messages">
                    {chatMessages.length === 0 && (
                        <div className="chat-empty">
                            <p className="mb-2">Ask me anything about the publications!</p>
                            <p className="text-sm">Try: "What do we know about bone density loss?"</p>
                        </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={msg.role === 'user' ? "chat-message-user" : "chat-message-assistant"}>
                            <div className="text-sm">{msg.content}</div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="chat-message-assistant">
                            <div className="text-sm">Thinking...</div>
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <input	type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Ask about the research..."
                            className="chat-input"
                            disabled={isLoading}
                            />
                    <button onClick={sendChatMessage} disabled={isLoading} className="btn">
                    Send
                    </button>
                </div>
            </div>
            )}

            {/* Paper Detail Modal */}
            {selectedPaper && (
            <div className="modal-overlay" onClick={() => setSelectedPaper(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">{selectedPaper.title}</h2>
                        <button onClick={() => setSelectedPaper(null)} className="close-btn">
                        <X className="icon" />
                        </button>
                    </div>

                    <p className="publication-meta">{selectedPaper.authors} ({selectedPaper.year})</p>

                    <div className="pub-tags">
                        <span className="tag tag-green">{selectedPaper.organism}</span>
                        <span className="tag tag-purple">{selectedPaper.topic}</span>
                        {selectedPaper.conditions.map(cond => (
                        <span key={cond} className="tag tag-orange">{cond}</span>
                        ))}
                    </div>

                    <h3 className="section-title">Abstract</h3>
                    <p className="publication-abstract">{selectedPaper.abstract}</p>

                    <h3 className="section-title">Details</h3>
                    <p className="publication-meta">Citations: {selectedPaper.citations}</p>
                    <p className="publication-meta">Keywords: {selectedPaper.keywords.join(', ')}</p>

                    <button
                        onClick={() => {
                        setSelectedPaper(null);
                        setShowChat(true);
                        setChatInput(`Tell me more about "${selectedPaper.title}"`);
                        }}
                        className="btn"
                        >
                        <MessageSquare className="icon" />
                        Ask AI About This Paper
                    </button>
                </div>
            </div>
            )}
        </div>
	);
}
// ========================================================================================================


export default App;
