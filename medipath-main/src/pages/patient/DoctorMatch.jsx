import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Award, Plus, X, Loader2, Stethoscope, Activity, Map, Home, AlertTriangle, Mic, MicOff } from 'lucide-react';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import { SYMPTOM_DOCTOR_MAP, SYMPTOM_CATEGORIES } from '../../data/symptoms';
import { aiMatchDoctors } from '../../utils/aiMatchmaker';
import { generateHomeCarePlan } from '../../utils/aiHomeCare';

export default function DoctorMatch({ user, onLogout, onSelectDoctor }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [matchedDoctors, setMatchedDoctors] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [showSOS, setShowSOS] = useState(false);
  const [activeCategory, setActiveCategory] = useState('General');
  const [userCity, setUserCity] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showHomeCareModal, setShowHomeCareModal] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('medipath_current_queue')) {
      navigate('/patient/queue-status');
    }
  }, [navigate]);

  const detectLocation = async () => {
    setDetectingLoc(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setDetectingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        if (city) setUserCity(city);
        else alert("Could not determine city from coordinates.");
      } catch(e) {
        console.error(e);
        alert("Failed to reverse geocode location.");
      } finally {
        setDetectingLoc(false);
      }
    }, (error) => {
      console.error(error);
      alert("Location access denied or unavailable.");
      setDetectingLoc(false);
    });
  };

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms(prev => [...prev, trimmed]);
      setCustomSymptom('');
    }
  };

  const toggleListening = () => {
    if (isListening) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && !selectedSymptoms.includes(transcript.trim())) {
        setSelectedSymptoms(prev => [...prev, transcript.trim()]);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const searchDoctors = async () => {
    if (!selectedSymptoms.length) return;
    
    // Critical Triage / Auto-SOS Check
    const emergencyKeywords = ['chest pain', 'heart', 'stroke', 'bleeding', 'breath', 'unconscious', 'faint', 'suicide', 'severe pain', 'choking'];
    const allText = [...selectedSymptoms, customSymptom].join(' ').toLowerCase();
    
    const isEmergency = emergencyKeywords.some(keyword => allText.includes(keyword));
    
    if (isEmergency) {
      setShowSOS(true);
      // We will no longer return here, so that doctor search continues in the background!
    }

    // Check Cache
    const cacheKey = `medipath_match_v6_${allText}_${userCity}`.replace(/\s+/g, '_');
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setMatchedDoctors(JSON.parse(cached));
      return;
    }

    setSearching(true);
    try {
      const matched = await aiMatchDoctors(selectedSymptoms, customSymptom, userCity);
      sessionStorage.setItem(cacheKey, JSON.stringify(matched));
      setMatchedDoctors(matched);
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectDoctor = (doc) => {
    setLoadingDoctor(true);
    onSelectDoctor(doc);
    navigate('/patient/select-slot', { state: { doctor: doc, symptoms: selectedSymptoms } });
  };

  const categories = Object.keys(SYMPTOM_CATEGORIES);

  const requestHomeCare = async () => {
    setGeneratingPlan(true);
    setAiError('');
    try {
      const result = await generateHomeCarePlan(user.email, user.name, selectedSymptoms, customSymptom);
      if (result.success) {
        setShowHomeCareModal(false);
        navigate('/patient/medications');
      } else {
        setAiError(result.reason || "Safety check failed. Please book a doctor.");
      }
    } catch(err) {
      setAiError("Request failed.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={1} onLogout={onLogout} />

      <div className="page-container">

        {/* Hero Header */}
        <div className="section-header fade-in" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79,70,229,0.3)', flexShrink: 0,
            }}>
              <Stethoscope size={26} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', marginBottom: 6 }}>
                Find Your Specialist
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                Describe your symptoms — our AI matches you with the best available doctor.
              </p>
            </div>
          </div>
        </div>

        {/* Symptom Selector Card */}
        <div className="med-card card-pad-md fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Select Symptoms</h2>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 6 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 40,
                  border: activeCategory === cat ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--bg-section)',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symptom Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            {(SYMPTOM_CATEGORIES[activeCategory] || []).map(s => {
              const active = selectedSymptoms.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 40,
                    border: active ? '2px solid var(--primary)' : '2px solid var(--border)',
                    background: active ? 'var(--primary)' : 'white',
                    color: active ? 'white' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: active ? '0 4px 12px rgba(79,70,229,0.25)' : 'var(--shadow-sm)',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  {active && '✓ '}{s}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              <input
                value={customSymptom}
                onChange={e => setCustomSymptom(e.target.value)}
                placeholder="Add a custom symptom or click mic to speak..."
                onKeyDown={e => e.key === 'Enter' && addCustomSymptom()}
                style={{ flex: 1, borderRadius: 40, paddingRight: 48 }}
              />
              <button 
                onClick={toggleListening}
                style={{ 
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isListening ? 'var(--danger)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {isListening ? <Mic className="animate-pulse" size={20} /> : <MicOff size={20} />}
              </button>
            </div>
            <button className="btn btn-outline" onClick={addCustomSymptom} style={{ borderRadius: 40, whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Location Input */}
          <div style={{ display: 'flex', gap: 12, marginBottom: selectedSymptoms.length ? 24 : 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={userCity}
                onChange={e => setUserCity(e.target.value)}
                placeholder="Enter your City (Optional for nearby doctors)"
                style={{ width: '100%', borderRadius: 40, paddingLeft: 42 }}
              />
              <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button className="btn btn-primary" onClick={detectLocation} disabled={detectingLoc} style={{ borderRadius: 40, whiteSpace: 'nowrap' }}>
              {detectingLoc ? <Loader2 size={16} className="animate-spin" /> : <Map size={16} />} 
              Detect Location
            </button>
          </div>

          {/* Selected Summary */}
          {selectedSymptoms.length > 0 && (
            <div style={{
              padding: '20px 24px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(237,233,254,0.5) 100%)',
              border: '2px solid rgba(79,70,229,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Activity size={16} color="var(--primary)" />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-strong)' }}>
                  {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {selectedSymptoms.map(s => (
                  <span key={s} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 40,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}>
                    {s}
                    <X size={14} style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => toggleSymptom(s)} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search CTA */}
        <button
          className="btn btn-primary btn-lg btn-full fade-in"
          onClick={searchDoctors}
          disabled={!selectedSymptoms.length || searching}
          style={{ fontSize: '1.05rem' }}
        >
          {searching ? (
            <><Loader2 size={20} className="animate-spin" /> Running AI Analysis...</>
          ) : (
            <><Search size={20} /> Find Best Matched Doctors</>
          )}
        </button>

        {/* Instant Home Care Pathway (Alternative Option) */}
        {!searching && matchedDoctors.length === 0 && selectedSymptoms.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
             <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
               Or, skip the waiting room for mild symptoms
             </p>
             <button
                className="btn btn-lg btn-full"
                onClick={() => setShowHomeCareModal(true)}
                style={{ 
                  background: 'rgba(79, 70, 229, 0.05)', 
                  border: '2px solid rgba(79, 70, 229, 0.3)', 
                  color: 'var(--primary-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '1.05rem', fontWeight: 800
                }}
             >
                <Home size={20} /> Get Instant AI Home-Care Plan
             </button>
          </div>
        )}

        {/* Results */}
        {matchedDoctors.length > 0 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, marginTop: 8 }}>
              <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Matched Doctors</h2>
              <span className="badge badge-neutral">{matchedDoctors.length} results</span>
            </div>

            <div>
              {matchedDoctors.map((doc, i) => (
                <div
                  key={doc.id}
                  className={`doctor-card card-pad-md fade-in ${i === 0 ? 'best-match' : ''}`}
                  style={{ animationDelay: `${i * 0.06}s`, position: 'relative' }}
                >
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: -14, left: 24,
                      background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
                      color: 'white',
                      padding: '5px 16px',
                      borderRadius: 40,
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
                    }}>
                      ⭐ Best Match
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.3rem',
                      background: i === 0
                        ? 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)'
                        : 'var(--bg-section)',
                      color: i === 0 ? 'white' : 'var(--text-secondary)',
                      boxShadow: i === 0 ? '0 8px 20px rgba(79,70,229,0.25)' : 'none',
                      overflow: 'hidden'
                    }}>
                      {doc.photoUrl ? (
                         <img src={doc.photoUrl} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                         doc.avatar
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        {doc.name}
                      </div>
                      <div style={{ color: 'var(--primary-strong)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>
                        {doc.specialty}
                      </div>
                      {doc.bio && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16, maxWidth: '540px' }}>
                          {doc.bio}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 14 }}>
                        {doc.hospital && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)' }}>
                            🏥 {doc.hospital}
                          </span>
                        )}
                        {doc.contact && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                            📞 {doc.contact}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} /> {doc.city}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Star size={14} color="#F59E0B" fill="#F59E0B" /> {doc.rating}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Award size={14} /> {doc.yearsExperience} yrs exp
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span className={`badge ${doc.available ? 'badge-success' : 'badge-danger'}`}>
                          {doc.available ? '● Available Now' : '● Unavailable'}
                        </span>
                        <span className="badge badge-neutral">₹{doc.consultationFee}</span>
                        {doc.qualifications && (
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {doc.qualifications.split(',')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score + CTA */}
                    <div style={{ textAlign: 'center', minWidth: 130, flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1,
                        color: doc.score > 80 ? 'var(--success)' : 'var(--primary)',
                        marginBottom: 4,
                      }}>
                        {doc.score}%
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        match score
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => selectDoctor(doc)}
                        disabled={loadingDoctor || !doc.available}
                        style={{ width: '100%' }}
                      >
                        {loadingDoctor ? 'Loading...' : 'Select Doctor'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedDoctors.length === 0 && !searching && selectedSymptoms.length > 0 && (
          <div className="med-card fade-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Stethoscope size={48} color="var(--text-muted)" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ marginBottom: 10 }}>No Results Found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try selecting different symptoms or adding a custom one.</p>
          </div>
        )}
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}

      {/* AI Home Care Safety Modal */}
      {showHomeCareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="med-card fade-in" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
               <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
               }}>
                  <AlertTriangle color="#F59E0B" size={28} />
               </div>
               <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '6px', color: 'var(--text-primary)' }}>Safety Verification</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                     Our AI agent can generate a fast Home-Care plan and suggest OTC medications. However, it is an AI tool and <strong style={{color:'var(--text-primary)'}}>NOT</strong> a licensed medical professional. You must agree that this is only for minor symptoms.
                  </p>
               </div>
            </div>
            {aiError && (
              <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#B91C1C', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5 }}>
                ⚠️ AI Triage Refused:<br/>{aiError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
               <button className="btn btn-outline" style={{ borderRadius: '40px', padding: '0 24px' }} onClick={() => {setShowHomeCareModal(false); setAiError('');}}>Cancel</button>
               <button className="btn btn-primary" style={{ borderRadius: '40px', padding: '0 24px' }} onClick={requestHomeCare} disabled={generatingPlan}>
                  {generatingPlan ? <><Loader2 className="animate-spin mr-2" size={16}/> Analyzing Symptoms...</> : 'I Understand & Agree'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
