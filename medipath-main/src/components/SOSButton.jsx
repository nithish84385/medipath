import { AlertTriangle } from 'lucide-react';

export default function SOSButton({ onPress }) {
  return (
    <button className="sos-btn" onClick={onPress} title="Emergency SOS">
      <AlertTriangle size={20} />
      <span style={{ fontSize: '0.625rem', fontWeight: 800 }}>SOS</span>
    </button>
  );
}
