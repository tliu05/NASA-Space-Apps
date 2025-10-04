import React, { useState, useMemo } from 'react';
import { Search, Filter, MessageSquare, TrendingUp, BookOpen, Beaker, X } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data - replace with real publication data
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

  // Filter publications
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

  // AI Chat function using Claude API
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
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an AI assistant helping scientists explore NASA space biology research. Based on the following publications, answer the user's question. Be specific and cite relevant studies when possible.

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
        content: data.content[0].text
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

  const organisms = ['All', 'Plants', 'Humans', 'Microbes', 'Other'];
  const years = ['All', '2024', '2023', '2022', '2021', '2020', '2019'];
  const topics = ['All', 'Plant Biology', 'Human Physiology', 'Microbiology', 'Model Organisms'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Beaker className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">NASA Space Biology Knowledge Engine</h1>
                <p className="text-sm text-blue-300">Exploring 608 Publications</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              AI Assistant
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-blue-400">608</div>
            <div className="text-sm text-gray-300">Total Publications</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-green-400">182</div>
            <div className="text-sm text-gray-300">Plant Studies</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-purple-400">156</div>
            <div className="text-sm text-gray-300">Human Studies</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-3xl font-bold text-orange-400">2019-2024</div>
            <div className="text-sm text-gray-300">Year Range</div>
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Publications Over Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="year" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Research Topics</h3>
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search publications by title, abstract, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                value={selectedOrganism}
                onChange={(e) => setSelectedOrganism(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {organisms.map(org => (
                  <option key={org} value={org} className="bg-slate-800">{org}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year} className="bg-slate-800">{year}</option>
                ))}
              </select>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic} className="bg-slate-800">{topic}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-300">
            Showing {filteredPublications.length} of {mockPublications.length} publications
          </div>
        </div>

        {/* Publications List */}
        <div className="space-y-4">
          {filteredPublications.map(pub => (
            <div
              key={pub.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20 hover:border-blue-500/50 transition-all cursor-pointer"
              onClick={() => setSelectedPaper(pub)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-blue-300 flex-1">{pub.title}</h3>
                <span className="text-sm bg-blue-600/30 px-3 py-1 rounded-full ml-4">{pub.year}</span>
              </div>
              
              <p className="text-sm text-gray-300 mb-3">{pub.authors}</p>
              
              <p className="text-gray-200 mb-3 line-clamp-2">{pub.abstract}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs bg-green-600/30 px-2 py-1 rounded">{pub.organism}</span>
                <span className="text-xs bg-purple-600/30 px-2 py-1 rounded">{pub.topic}</span>
                {pub.conditions.map(cond => (
                  <span key={cond} className="text-xs bg-orange-600/30 px-2 py-1 rounded">{cond}</span>
                ))}
              </div>
              
              <div className="text-xs text-gray-400">
                {pub.citations} citations • Keywords: {pub.keywords.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="fixed right-4 bottom-4 w-96 h-[500px] bg-slate-900 border border-blue-500/30 rounded-lg shadow-2xl flex flex-col">
          <div className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI Research Assistant
            </h3>
            <button onClick={() => setShowChat(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <p className="mb-2">Ask me anything about the publications!</p>
                <p className="text-sm">Try: "What do we know about bone density loss?"</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-8'
                    : 'bg-white/10 mr-8'
                }`}
              >
                <div className="text-sm">{msg.content}</div>
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-white/10 p-3 rounded-lg mr-8">
                <div className="text-sm text-gray-400">Thinking...</div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about the research..."
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedPaper(null)}>
          <div className="bg-slate-900 border border-blue-500/30 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-blue-300">{selectedPaper.title}</h2>
              <button onClick={() => setSelectedPaper(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">{selectedPaper.authors} ({selectedPaper.year})</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm bg-green-600/30 px-3 py-1 rounded">{selectedPaper.organism}</span>
              <span className="text-sm bg-purple-600/30 px-3 py-1 rounded">{selectedPaper.topic}</span>
              {selectedPaper.conditions.map(cond => (
                <span key={cond} className="text-sm bg-orange-600/30 px-3 py-1 rounded">{cond}</span>
              ))}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Abstract</h3>
            <p className="text-gray-200 mb-4">{selectedPaper.abstract}</p>
            
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <p className="text-gray-300 mb-2">Citations: {selectedPaper.citations}</p>
            <p className="text-gray-300">Keywords: {selectedPaper.keywords.join(', ')}</p>
            
            <button
              onClick={() => {
                setSelectedPaper(null);
                setShowChat(true);
                setChatInput(`Tell me more about "${selectedPaper.title}"`);
              }}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI About This Paper
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
