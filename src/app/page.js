"use client";
import { useState, useEffect } from "react";
import { Search, MapPin, Briefcase, Hash, Globe, Phone, PhoneOff, Smartphone, CheckCircle2, AlertCircle, History, Send, Server } from "lucide-react";

export default function LeadFinder() {
  const [activeTab, setActiveTab] = useState("search");

  // Search State
  const [activity, setActivity] = useState("");
  const [city, setCity] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(true);
  const [onlyMobile, setOnlyMobile] = useState(true);
  const [excludeHistory, setExcludeHistory] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searched, setSearched] = useState(false);

  // History State
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [targetNotion, setTargetNotion] = useState("paolo");
  const [sendingState, setSendingState] = useState("");

  const API_URL = "https://referee-neatness-rehydrate.ngrok-free.dev/api";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!activity || !city) return;
    
    setLoadingSearch(true);
    setSearchError(null);
    setSearched(true);
    setResults([]);

    try {
      const response = await fetch(`${API_URL}/leads/search`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1"
        },
        body: JSON.stringify({
          activity,
          city,
          max_results: maxResults,
          only_no_website: onlyNoWebsite,
          only_mobile: onlyMobile,
          exclude_history: excludeHistory
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Errore API Google Maps. Controlla la chiave API!");
      
      setResults(data.results || []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await fetch(`${API_URL}/leads/history`, {
        headers: {
          "ngrok-skip-browser-warning": "1"
        }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Errore API Cronologia");
      setHistorySessions(data.sessions || []);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  const toggleLeadSelection = (placeId) => {
    const newSel = new Set(selectedLeads);
    if (newSel.has(placeId)) newSel.delete(placeId);
    else newSel.add(placeId);
    setSelectedLeads(newSel);
  };

  const selectAllValidInSession = (session) => {
    const newSel = new Set(selectedLeads);
    session.leads.filter(l => l.is_valid).forEach(l => newSel.add(l.place_id));
    setSelectedLeads(newSel);
  };

  const deselectAllInSession = (session) => {
    const newSel = new Set(selectedLeads);
    session.leads.forEach(l => newSel.delete(l.place_id));
    setSelectedLeads(newSel);
  };

  const getSelectedLeadsObjects = () => {
    const selected = [];
    historySessions.forEach(s => {
      s.leads.forEach(l => {
        if (selectedLeads.has(l.place_id)) {
          selected.push({ ...l, activity: s.activity, target: targetNotion });
        }
      });
    });
    return selected;
  };

  const sendToNotion = async (status) => {
    const leadsToSend = getSelectedLeadsObjects();
    if (leadsToSend.length === 0) return alert("Nessun lead selezionato");
    setSendingState(`Invio a Notion (${status}) in corso...`);
    try {
      const leadsWithStatus = leadsToSend.map(l => ({ ...l, customStatus: status }));
      const res = await fetch(`${API_URL}/leads/notion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1'
        },
        body: JSON.stringify({ 
          leads: leadsWithStatus, 
          target: targetNotion,
          activity: leadsToSend[0]?.activity || "Altro"
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      alert(`✅ ${data.count} lead creati su Notion con successo!`);
      setSelectedLeads(new Set());
    } catch (e) {
      alert("Errore invio Notion: " + e.message);
    } finally {
      setSendingState("");
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '80px' }}>
      <header className="header">
        <h1 className="title">Lead Finder</h1>
        <p className="subtitle">{activeTab === "search" ? "Ricerca e salva leads in tempo reale." : "Storico ricerche e invio ai sistemi."}</p>
      </header>

      <main className="main-content">
        {activeTab === "search" && (
          <div className="tab-content fade-in">
            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label className="form-label"><Briefcase size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/> Attività</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="es. Pizzeria, Avvocato, Dentista" 
                  value={activity}
                  onChange={e => setActivity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label"><MapPin size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/> Città</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="es. Milano, Roma" 
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label"><Hash size={14} style={{display:'inline', marginBottom:'-2px', marginRight:'4px'}}/> Risultati Massimi</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" max="100"
                  value={maxResults}
                  onChange={e => setMaxResults(parseInt(e.target.value))}
                />
              </div>

              <div className="toggle-group">
                <label className="toggle-item">
                  <div className="toggle-text">
                    <span className="toggle-title">Solo senza sito web</span>
                    <span className="toggle-desc">Esclude aziende che hanno già un sito</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={onlyNoWebsite} onChange={e => setOnlyNoWebsite(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </label>

                <label className="toggle-item">
                  <div className="toggle-text">
                    <span className="toggle-title">Solo cellulari</span>
                    <span className="toggle-desc">Richiesto per il bot WhatsApp</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={onlyMobile} onChange={e => setOnlyMobile(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </label>

                <label className="toggle-item">
                  <div className="toggle-text">
                    <span className="toggle-title">Escludi già contattati</span>
                    <span className="toggle-desc">Non salva i lead già presenti nel DB</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={excludeHistory} onChange={e => setExcludeHistory(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </label>
              </div>

              <button type="submit" className="btn-primary" disabled={loadingSearch || !activity || !city}>
                {loadingSearch ? (
                  <><Search size={20} className="spin" /> Ricerca in corso...</>
                ) : (
                  <><Search size={20} /> Cerca Lead</>
                )}
              </button>
            </form>

            {searchError && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} style={{minWidth: '20px'}}/> {searchError}
              </div>
            )}

            {searched && !loadingSearch && !searchError && (
              <div className="results-container">
                <div className="results-header">
                  <h2 className="results-title">Risultati Salvati</h2>
                  <span className="results-badge">{results.length} Trovati</span>
                </div>
                
                {results.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8e93' }}>
                    <Search size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                    <p>Nessun nuovo lead trovato con questi filtri.</p>
                  </div>
                ) : (
                  results.map((lead, idx) => (
                    <div key={lead.place_id} className="lead-card" style={{ animationDelay: `${idx * 30}ms` }}>
                      <div className="lead-name">{lead.name}</div>
                      <div className="lead-address">{lead.address}</div>
                      <div className="lead-badges">
                        <span className="badge badge-phone">
                          {lead.is_mobile ? <Smartphone size={12} /> : <Phone size={12} />} 
                          {lead.phone || 'Nessun numero'}
                        </span>
                        {lead.website ? (
                          <span className="badge badge-web"><Globe size={12} /> Ha un sito</span>
                        ) : (
                          <span className="badge badge-noweb"><Globe size={12} /> No Sito</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="tab-content fade-in">
            {/* Pulsanti Azione Floating */}
            {selectedLeads.size > 0 && (
              <div style={{ position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 50, background: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedLeads.size} Lead Selezionati</span>
                  <select 
                    style={{ background: '#000', color: '#fff', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px' }}
                    value={targetNotion}
                    onChange={(e) => setTargetNotion(e.target.value)}
                  >
                    <option value="paolo">👤 Paolo</option>
                    <option value="giacomo">👤 Giacomo</option>
                  </select>
                </div>
                {sendingState && <div style={{ fontSize: '13px', color: '#8e8e93', textAlign: 'center' }}>{sendingState}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => sendToNotion("Da Contattare")} disabled={!!sendingState} style={{ flex: 1, padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    <Server size={16} /> Solo Notion
                  </button>
                  <button onClick={() => sendToNotion("Inviato al raspberry")} disabled={!!sendingState} style={{ flex: 1, padding: '12px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    <Send size={16} /> Invia a Raspberry
                  </button>
                </div>
              </div>
            )}

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Search size={32} className="spin" style={{ margin: '0 auto', color: 'var(--primary)' }} /></div>
            ) : historyError ? (
              <div style={{ padding: '16px', background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', borderRadius: '12px' }}>{historyError}</div>
            ) : historySessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8e8e93' }}>Nessuna ricerca passata.</div>
            ) : (
              historySessions.map(session => (
                <div key={session.id} style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '16px', overflow: 'hidden' }}>
                  <div 
                    style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedSession === session.id ? 'var(--surface-hover)' : 'transparent' }}
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '17px' }}>{session.activity} a {session.city}</div>
                      <div style={{ fontSize: '12px', color: '#8e8e93', marginTop: '4px' }}>{new Date(session.timestamp).toLocaleString('it-IT')} • {session.leads.length} trovati</div>
                    </div>
                  </div>
                  
                  {expandedSession === session.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button onClick={() => selectAllValidInSession(session)} style={{ flex: 1, padding: '8px', background: 'rgba(10, 132, 255, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Seleziona Validi</button>
                        <button onClick={() => deselectAllInSession(session)} style={{ flex: 1, padding: '8px', background: 'rgba(142, 142, 147, 0.1)', color: '#8e8e93', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Deseleziona Tutti</button>
                      </div>

                      {session.leads.map(lead => (
                        <div key={lead.place_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.has(lead.place_id)}
                            onChange={() => toggleLeadSelection(lead.place_id)}
                            style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '15px', color: lead.is_valid ? '#fff' : '#8e8e93' }}>
                              {lead.name} {!lead.is_valid && "(Scartato)"}
                            </div>
                            <div style={{ fontSize: '12px', color: '#8e8e93' }}>{lead.phone || 'No num'} • {lead.website ? 'Sito' : 'No sito'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
        <button 
          onClick={() => setActiveTab("search")}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === "search" ? 'var(--primary)' : '#8e8e93', cursor: 'pointer' }}
        >
          <Search size={24} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Ricerca</span>
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === "history" ? 'var(--primary)' : '#8e8e93', cursor: 'pointer' }}
        >
          <History size={24} />
          <span style={{ fontSize: '11px', fontWeight: 500 }}>Cronologia</span>
        </button>
      </nav>

      <style jsx global>{`
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
