"use client";
import { useState } from "react";
import { Search, MapPin, Briefcase, Hash, Globe, Phone, PhoneOff, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";

export default function LeadFinder() {
  const [activity, setActivity] = useState("");
  const [city, setCity] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(true);
  const [onlyMobile, setOnlyMobile] = useState(true);
  const [excludeHistory, setExcludeHistory] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Usa l'URL dell'API del Raspberry Pi (ngrok fisso)
  const API_URL = "https://referee-neatness-rehydrate.ngrok-free.dev/api/leads/search";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!activity || !city) return;
    
    setLoading(true);
    setError(null);
    setSearched(true);
    setResults([]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!data.success) throw new Error(data.error || "Errore sconosciuto");
      
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Lead Finder</h1>
        <p className="subtitle">Ricerca e salva leads in tempo reale.</p>
      </header>

      <main className="main-content">
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

          <button type="submit" className="btn-primary" disabled={loading || !activity || !city}>
            {loading ? (
              <><Search size={20} className="spin" /> Ricerca in corso...</>
            ) : (
              <><Search size={20} /> Cerca Lead</>
            )}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {searched && !loading && !error && (
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
      </main>
    </div>
  );
}
