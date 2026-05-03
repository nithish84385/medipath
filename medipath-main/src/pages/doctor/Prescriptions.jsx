import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Save,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserSearch,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PatientTimeline from '../../components/PatientTimeline';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import { genAI } from '../../lib/gemini';
import { db } from '../../lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const DEFAULT_MED = { name: '', dosage: '', days: '', instruction: 'After meals' };

function formatDateLabel(value) {
  if (!value) return 'Pending';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeLabel(value) {
  if (!value) return 'Awaiting schedule';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return value;
}

function getTimelineItems(queueItem, patientInfo, medications) {
  if (!queueItem && !patientInfo.email && !patientInfo.name) return [];

  const symptoms = Array.isArray(queueItem?.symptoms)
    ? queueItem.symptoms.join(', ')
    : queueItem?.symptoms || patientInfo.symptoms || 'Symptoms not recorded yet.';
  const validMeds = medications.filter((med) => med.name.trim());

  const items = [
    queueItem && {
      date: formatDateLabel(queueItem.timestamp),
      title: 'Patient request received',
      description: `${queueItem.patientName || patientInfo.name || 'Patient'} entered the care queue with ${symptoms}.`,
      type: 'normal',
      label: 'Queued',
      meta: queueItem.patientEmail || patientInfo.email || '',
    },
    queueItem && {
      date: queueItem.appointmentTime || formatDateTimeLabel(queueItem.approvedAt),
      title: 'Consultation scheduled',
      description: queueItem.appointmentTime
        ? `Appointment confirmed for ${queueItem.appointmentTime}.`
        : 'Patient is approved and waiting for the final consultation slot.',
      type: queueItem.appointmentTime ? 'success' : 'warning',
      label: queueItem.appointmentTime ? 'Scheduled' : 'Pending',
      meta: queueItem.doctorName || '',
    },
    (patientInfo.diagnosis || patientInfo.symptoms) && {
      date: 'Current draft',
      title: 'Clinical notes reviewed',
      description: patientInfo.diagnosis
        ? `Diagnosis: ${patientInfo.diagnosis}. Symptoms: ${patientInfo.symptoms || 'Not noted'}.`
        : `Symptoms documented for this visit: ${patientInfo.symptoms}.`,
      type: 'normal',
      label: 'Notes',
    },
    {
      date: 'Medication plan',
      title: validMeds.length ? 'Prescription draft ready' : 'Prescription pending',
      description: validMeds.length
        ? `${validMeds.length} medication${validMeds.length > 1 ? 's are' : ' is'} prepared for review before timing setup.`
        : 'Add medications to complete the treatment plan for this patient.',
      type: validMeds.length ? 'success' : 'warning',
      label: validMeds.length ? 'Prepared' : 'Needs attention',
    },
  ].filter(Boolean);

  return items;
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Prescriptions({ user, onLogout }) {
  const [saved, setSaved] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [sosAlert, setSosAlert] = useState(false);
  const [doctorQueue, setDoctorQueue] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  const [localMeds, setLocalMeds] = useState([{ ...DEFAULT_MED }]);
  const [localPatientInfo, setLocalPatientInfo] = useState({
    email: '',
    name: '',
    diagnosis: '',
    symptoms: '',
  });
  const [aiReview, setAiReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTemplates = localStorage.getItem('medipath_rx_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const handleSaveTemplate = () => {
    const validMeds = localMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) return alert('No medications to save.');
    const name = prompt('Enter a name for this template (e.g. "Standard Viral Fever"):');
    if (!name) return;
    
    const newTemplates = [...templates, { id: Date.now().toString(), name, meds: validMeds }];
    setTemplates(newTemplates);
    localStorage.setItem('medipath_rx_templates', JSON.stringify(newTemplates));
    alert('Template saved!');
  };

  const normalizeDoctorName = (value = '') =>
    value.toLowerCase().replace(/^dr\.?\s+/i, '').replace(/\s+/g, ' ').trim();

  useEffect(() => {
    const queueQuery = query(collection(db, 'queue_entries'));

    const unsubscribe = onSnapshot(queueQuery, (snapshot) => {
      const normalizedUserName = normalizeDoctorName(user?.name || user?.email || '');
      const nextQueue = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter((entry) => {
          if (entry.status !== 'scheduled') return false;

          const entryDoctorId = entry.doctorId || '';
          const entryDoctorEmail = (entry.doctorEmail || '').toLowerCase().trim();
          const entryDoctorName = normalizeDoctorName(entry.doctorName || '');
          const userEmail = (user?.email || '').toLowerCase().trim();
          const userUid = user?.uid || '';

          return (
            entryDoctorId === userUid ||
            entryDoctorEmail === userEmail ||
            (normalizedUserName && entryDoctorName === normalizedUserName)
          );
        })
        .sort((a, b) => {
          const aTime = new Date(a.approvedAt || a.timestamp || 0).getTime();
          const bTime = new Date(b.approvedAt || b.timestamp || 0).getTime();
          return aTime - bTime;
        });

      setDoctorQueue(nextQueue);
      setSelectedQueueId((current) => {
        if (current && nextQueue.some((entry) => entry.id === current)) return current;
        return nextQueue[0]?.id || '';
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for real-time SOS alerts for this doctor
  useEffect(() => {
    if (!user?.uid) return;
    const sosQuery = query(
      collection(db, 'sos_alerts'),
      where('doctorId', '==', user.uid),
      where('resolved', '==', false)
    );
    const unsub = onSnapshot(sosQuery, snap => {
      setSosAlert(snap.docs.length > 0);
    });
    return () => unsub();
  }, [user?.uid]);

  const selectedQueuePatient = useMemo(
    () => doctorQueue.find((entry) => entry.id === selectedQueueId) || null,
    [doctorQueue, selectedQueueId]
  );

  useEffect(() => {
    if (!selectedQueuePatient) return;

    setLocalPatientInfo((prev) => ({
      email: selectedQueuePatient.patientEmail || prev.email,
      name: selectedQueuePatient.patientName || prev.name,
      diagnosis: prev.diagnosis,
      symptoms: Array.isArray(selectedQueuePatient.symptoms)
        ? selectedQueuePatient.symptoms.join(', ')
        : selectedQueuePatient.symptoms || prev.symptoms,
    }));
  }, [selectedQueuePatient]);

  const timelineItems = useMemo(
    () => getTimelineItems(selectedQueuePatient, localPatientInfo, localMeds),
    [selectedQueuePatient, localPatientInfo, localMeds]
  );

  const validMedicationCount = useMemo(
    () => localMeds.filter((med) => med.name.trim()).length,
    [localMeds]
  );

  const addMed = () => setLocalMeds((prev) => [...prev, { ...DEFAULT_MED }]);

  const updateMed = (index, field, value) => {
    setLocalMeds((prev) =>
      prev.map((med, medIndex) => (medIndex === index ? { ...med, [field]: value } : med))
    );
  };

  const removeMed = (index) => {
    setLocalMeds((prev) => prev.filter((_, medIndex) => medIndex !== index));
  };

  const handleAiReview = async () => {
    const validMeds = localMeds.filter(m => m.name.trim());
    if (!validMeds.length) return alert('Add medications first.');
    setIsReviewing(true);
    setAiReview(null);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are an expert Clinical Scribe Agent assisting a doctor. 
      Review this prescription for obvious drug interactions, dosage warnings, or contraindications.
      Patient Diagnosis: ${localPatientInfo.diagnosis || 'Unknown'}
      Symptoms: ${localPatientInfo.symptoms || 'Unknown'}
      Medications: ${JSON.stringify(validMeds.map(m => ({name: m.name, dosage: m.dosage, instruction: m.instruction})))}
      Return a brief, concise markdown report (max 4 bullet points) with an overall 'Safe' or 'Warning' status header. Keep it extremely short.`;
      const result = await model.generateContent(prompt);
      setAiReview(result.response.text());
    } catch(e) {
      console.error(e);
      setAiReview("AI Review unavailable.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSave = async () => {
    const validMeds = localMeds.filter((med) => med.name.trim());
    if (!localPatientInfo.email.trim() || validMeds.length === 0) {
      alert('Please enter patient email and at least one medication.');
      return;
    }

    setSaved(true);

    try {
      const patientEmail = localPatientInfo.email.trim().toLowerCase();
      const activeQ = query(
        collection(db, 'prescriptions'),
        where('patientEmail', '==', patientEmail),
        where('status', '==', 'active')
      );
      const activeSnap = await getDocs(activeQ);

      if (!activeSnap.empty) {
        const batch = writeBatch(db);
        activeSnap.docs.forEach((item) => {
          batch.update(item.ref, {
            status: 'archived',
            archivedAt: new Date().toISOString(),
            archiveReason: 'Replaced by new prescription',
          });
        });
        await batch.commit();
      }

      const prescriptionData = {
        doctorId: user.uid,
        doctorName: user.name || user.email,
        patientEmail,
        patientName: localPatientInfo.name.trim(),
        patientId: selectedQueuePatient?.patientId || '',
        diagnosis: localPatientInfo.diagnosis.trim(),
        symptoms: localPatientInfo.symptoms.trim(),
        queueEntryId: selectedQueuePatient?.id || '',
        medications: validMeds.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          days: parseInt(med.days, 10) || 1,
          instruction: med.instruction,
          times: [],
          taken: [],
        })),
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);

      if (selectedQueuePatient?.id) {
        await updateDoc(doc(db, 'queue_entries', selectedQueuePatient.id), {
          status: 'completed',
          prescriptionId: docRef.id,
          prescriptionCreatedAt: new Date().toISOString(),
          attendedByDoctorId: user.uid,
          attendedByDoctorName: user.name || user.email,
        });
      }

      setTimeout(() => {
        setSaved(false);
        navigate('/doctor/timings', { state: { prescriptionId: docRef.id, meds: validMeds } });
      }, 800);
    } catch (err) {
      console.error('Error saving prescription:', err);
      alert('Failed to save prescription. Please try again.');
      setSaved(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {sosAlert ? (
        <div className="fixed right-4 top-4 z-[1500] w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-red-200 bg-white p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 leading-tight">SOS alert received</p>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                A patient has sent an emergency alert and may need immediate assistance.
              </p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="btn btn-danger flex-1" onClick={() => setSosAlert(false)}>Respond</button>
            <button className="btn btn-outline" onClick={() => setSosAlert(false)}>Dismiss</button>
          </div>
        </div>
      ) : null}

      <Navbar user={user} currentStep={1} onLogout={onLogout} />

      <main className="page-container-wide">
        <section className="med-card card-pad-md fade-in mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Prescription Workspace
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Write a clear treatment plan
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-500">
                Review the next patient in your queue, confirm the clinical context, and prepare a
                prescription that is easy to scan and safe to action.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:w-auto">
              <div className="rounded-2xl bg-[var(--bg-section)] border border-[var(--border)] px-5 py-4 min-w-[140px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Queue</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{doctorQueue.length}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">Patients waiting</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-5 py-4 min-w-[140px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500">Draft</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-indigo-900">{validMedicationCount}</p>
                <p className="mt-1 text-xs font-semibold text-indigo-500">Medications added</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-12 fade-in delay-100">
          <div className="lg:col-span-7 space-y-10">
            
            {/* Accepted Queue Card */}
            <div className="med-card card-pad-md">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-section)]">
                    <Clock3 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Patient Queue</h2>
                    <p className="mt-1 text-sm text-gray-500">Ordered by approval time.</p>
                  </div>
                </div>
                <span className="badge badge-neutral text-sm">{doctorQueue.length} active</span>
              </div>

              {doctorQueue.length === 0 ? (
                <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="font-bold text-gray-700">No scheduled patients right now</p>
                  <p className="mt-2 text-sm text-gray-500">New admin-approved consultations will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {doctorQueue.map((queueItem, index) => {
                    const isActive = queueItem.id === selectedQueueId;
                    const symptoms = Array.isArray(queueItem.symptoms)
                      ? queueItem.symptoms.join(', ')
                      : queueItem.symptoms || 'No symptoms recorded';

                    return (
                      <button
                        key={queueItem.id}
                        type="button"
                        onClick={() => setSelectedQueueId(queueItem.id)}
                        className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/10'
                            : 'border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="badge badge-neutral bg-white shrink-0">#{index + 1}</span>
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {queueItem.patientName || queueItem.patientEmail || 'Unknown patient'}
                              </h3>
                              {isActive && <span className="badge badge-primary shrink-0">Selected</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-500">{queueItem.patientEmail}</p>
                          </div>
                          <div className="sm:text-right shrink-0">
                            <p className="font-bold text-gray-900 text-sm">
                              {queueItem.appointmentTime || 'Time not set'}
                            </p>
                            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Slot</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 border-opacity-60">
                           <p className="text-sm text-gray-600 line-clamp-2">
                             <span className="font-bold text-gray-800">Symptoms:</span> {symptoms}
                           </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Patient Info Form */}
            <div className="med-card card-pad-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-section)] border border-[var(--border)]">
                  <UserSearch className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">Patient Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Keep the drafted context concise and focused.</p>
                </div>
              </div>

              {selectedQueuePatient && (
                <div className="mb-6 flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm font-semibold">Loaded successfully from the approved queue.</p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Email Address">
                  <input value={localPatientInfo.email} onChange={e => setLocalPatientInfo(p => ({ ...p, email: e.target.value }))} placeholder="patient@example.com" />
                </Field>
                <Field label="Full Name">
                  <input value={localPatientInfo.name} onChange={e => setLocalPatientInfo(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                </Field>
                <Field label="Primary Diagnosis">
                  <input value={localPatientInfo.diagnosis} onChange={e => setLocalPatientInfo(p => ({ ...p, diagnosis: e.target.value }))} placeholder="E.g. Viral Pharyngitis" />
                </Field>
                <Field label="Key Symptoms">
                  <input value={localPatientInfo.symptoms} onChange={e => setLocalPatientInfo(p => ({ ...p, symptoms: e.target.value }))} placeholder="Cough, fever" />
                </Field>
              </div>
            </div>

            {/* Medications List */}
            <div className="med-card card-pad-md">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100">
                    <ClipboardList className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Medications</h2>
                    <p className="text-sm text-gray-500 mt-1">Add clear dosages to transition smoothly to timings.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {templates.length > 0 && (
                    <select 
                      className="btn btn-outline shrink-0 text-sm py-1 px-2 border-gray-300"
                      onChange={(e) => {
                        if(e.target.value) {
                          const tmpl = templates.find(t => t.id === e.target.value);
                          if(tmpl) setLocalMeds([...tmpl.meds]);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Load Template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <button type="button" onClick={handleSaveTemplate} className="btn btn-outline shrink-0" title="Save current medications as a template">
                    <Save className="h-4 w-4" /> Save Template
                  </button>
                  <button type="button" onClick={addMed} className="btn btn-primary shrink-0">
                    <Plus className="h-4 w-4" /> Add Rx
                  </button>
                </div>
              </div>

              <div className="space-y-10">
                {localMeds.map((med, index) => (
                  <div key={index} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-section)] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white font-bold text-gray-900 shadow-sm flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h3 className="font-bold text-gray-800 tracking-tight">Rx Block</h3>
                      </div>
                      {localMeds.length > 1 && (
                        <button type="button" onClick={() => removeMed(index)} className="btn btn-ghost btn-sm text-red-500">
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                      <Field label="Rx Name">
                        <input value={med.name} onChange={e => updateMed(index, 'name', e.target.value)} placeholder="Paracetamol 500mg" />
                      </Field>
                      <Field label="Dosage">
                        <input value={med.dosage} onChange={e => updateMed(index, 'dosage', e.target.value)} placeholder="1 tablet" />
                      </Field>
                      <Field label="Duration (Days)">
                        <input type="number" value={med.days} onChange={e => updateMed(index, 'days', e.target.value)} placeholder="7" />
                      </Field>
                      <Field label="Instruction">
                        <select value={med.instruction} onChange={e => updateMed(index, 'instruction', e.target.value)}>
                          <option>After meals</option>
                          <option>Before meals</option>
                          <option>With food</option>
                          <option>Empty stomach</option>
                          <option>At bedtime</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Scribe Section */}
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                       ✨ Clinical Scribe Agent
                    </h3>
                    <p className="text-sm text-indigo-700/80 mt-1">Analyze prescription for drug interactions and dosage safety before saving.</p>
                  </div>
                  <button type="button" onClick={handleAiReview} disabled={isReviewing} className="btn bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto w-full border-none shadow-md">
                    {isReviewing ? 'Analyzing...' : 'Run Safety Check'}
                  </button>
                </div>
                {aiReview && (
                  <div className="mt-5 p-5 bg-white rounded-xl border border-indigo-100 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {aiReview}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Timeline */}
          <div className="lg:col-span-5 space-y-10">
            <PatientTimeline timeline={timelineItems} />
            
            <div className="med-card card-pad-md sticky top-[100px]">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-md">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">Final Snapshot</h2>
                  <p className="text-sm text-gray-500 mt-1">Review before confirming plan.</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-section)] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Patient Target</p>
                  <p className="mt-2 text-lg font-bold text-gray-900 truncate">
                    {selectedQueuePatient?.patientName || localPatientInfo.name || 'Anonymous'}
                  </p>
                  <p className="text-sm font-medium text-gray-500 truncate mt-0.5">
                    {selectedQueuePatient?.patientEmail || localPatientInfo.email || 'Awaiting entry...'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-section)] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">ICD / Dx</p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {localPatientInfo.diagnosis || '--'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Medicine Array</p>
                    <p className="text-2xl font-extrabold text-indigo-900 leading-none">
                      {validMedicationCount}
                    </p>
                    <p className="text-xs font-semibold text-indigo-600 mt-1">Ready for timings</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className="btn btn-primary btn-lg btn-full"
              >
                {saved ? (
                  <> <Save className="h-5 w-5 mr-2" /> Saving Draft... </>
                ) : (
                  <> Advance to Timings <ArrowRight className="h-5 w-5 ml-2" /> </>
                )}
              </button>
            </div>
          </div>
        </section>
      </main>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} doctorName="Emergency Services" />}
    </div>
  );
}
