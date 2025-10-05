// brady was here
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MessageSquare, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import './App.css';
import publications from './publications.js';

console.log(publications); // Preview the CSV-based publications array

// Main App Component -------------------------------------------------------------------------------------
function App() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);


    // Escape key closes modal
    useEffect(() => {
    if (!selectedPaper) return;
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') setSelectedPaper(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPaper]);



    // Filter publications -------------------------------------------------------------------
    const filteredPublications = useMemo(() => {
    return publications.filter(pub => {
        const matchesSearch =
        searchQuery === '' ||
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });
    }, [searchQuery]);
    // ---------------------------------------------------------------------------------------

    // AI Chat function using Claude API -----------------------------------------------------
    const sendChatMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsLoading(true);

        try {
            // Build context from publications (CSV-safe)
            const publicationsContext = publications
            .map(pub => `Title: ${pub.title}\nLink: ${pub.link}\nKeywords: ${pub.keywords.join(', ')}`)
            .join('\n---\n');

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


    // Main render
    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
            <div className="header-inner">
                <div className="header-left">
                <div>
                    <h1 className="header-title">NASA Space Biology Knowledge Engine</h1>
                    <p className="header-subtitle">Exploring {publications.length} Publications</p>
                </div>
                </div>
                <button onClick={() => setShowChat(!showChat)} className="btn">
                <MessageSquare className="icon" />
                AI Assistant (WIP)
                </button>
            </div>
            </header>


            {/* Graph stuff */}

            <div className="graph-section">
                <h2 className="section-title">Similarity Matrix Visualization</h2>
                <div className="graph-container" style={{ height: '1000px' }}>
                    <iframe
                        src="http://127.0.0.1:8050/"
                        title="Dash Similarity Matrix"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    />
                </div>
            </div>
            



            {/* Main Content ----------------------------------------------------------------------------*/}
            <div className="main-content">
            {/* Search */}
            <div className="filter-panel">
                <div className="filter-row">
                <div className="search-box">
                    <Search className="search-icon" />
                    <input
                    type="text"
                    placeholder="Search publications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    />
                </div>
                </div>
                <div className="filter-count">
                Showing {filteredPublications.length} of {publications.length} publications
                </div>
            </div>

            {/* Publications List */}
            <div className="pub-list">
                {filteredPublications.map(pub => (
                <div key={pub.id} className="publication-card" onClick={() => setSelectedPaper(pub)}>
                    <div className="pub-header">
                    <h3 className="publication-title">{pub.title}</h3>
                    </div>

                    <p className="publication-meta">{pub.link}</p>
                    <div className="pub-extra">Keywords: {pub.keywords.join(', ')}</div>
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
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
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

                <p className="publication-meta">
                    <a href={selectedPaper.link} target="_blank" rel="noopener noreferrer" className="publication-link">
                        {selectedPaper.link}
                    </a>
                </p>

                <div className="pub-extra">Keywords: {selectedPaper.keywords.join(', ')}</div>
                </div>
            </div>
            )}
        </div>
    );
}
// ========================================================================================================

export default App;
