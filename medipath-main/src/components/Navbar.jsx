import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Stethoscope, LogOut, LayoutDashboard, Pill, HeartPulse, History, User, ClipboardList } from 'lucide-react';
import StepProgress from './StepProgress';

export default function Navbar({ user, currentStep, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';
  const showSteps = currentStep >= 1;

  const patientLinks = [
    { label: 'Home',        path: '/patient/dashboard',  icon: LayoutDashboard },
    { label: 'Medications', path: '/patient/medications', icon: Pill },
    { label: 'Recovery',    path: '/patient/recovery',    icon: HeartPulse },
    { label: 'History',     path: '/patient/history',     icon: History },
    { label: 'Profile',     path: '/patient/profile',     icon: User },
  ];

  const doctorLinks = [
    { label: 'Dashboard',    path: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Prescriptions', path: '/doctor/prescribe', icon: ClipboardList },
  ];

  const links = isDoctor ? doctorLinks : isPatient ? patientLinks : [];

  return (
    <nav className="top-nav">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer shrink-0"
        onClick={() => navigate(isDoctor ? '/doctor/dashboard' : isPatient ? '/patient/dashboard' : '/admin/queue')}>
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm"
          style={{ background: isDoctor ? 'linear-gradient(135deg, var(--primary), var(--primary-strong))' : isPatient ? 'linear-gradient(135deg, var(--success), #059669)' : '#8b5cf6' }}>
          <Stethoscope size={20} color="white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-[17px] tracking-tight text-gray-900 leading-tight">MediPath</span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
            {isDoctor ? 'Clinical' : isPatient ? 'Patient' : 'Admin'} Portal
          </span>
        </div>
      </div>

      {/* Middle: Steps or Nav Links */}
      {showSteps ? (
        <StepProgress current={currentStep} role={user.role} />
      ) : (
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => {
            const active = location.pathname === l.path;
            return (
              <Link key={l.path} to={l.path}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: active ? 'var(--primary-light)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                <l.icon size={15} />
                {l.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right: User + Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-[13px] font-bold leading-tight text-gray-800">
            {isDoctor ? 'Dr. ' : ''}{user.name}
          </div>
          <div className="text-[11px] font-mono font-medium text-gray-400 tracking-tight">{user.email}</div>
        </div>
        <button
          className="btn btn-ghost !px-3 !py-2 hover:bg-gray-100/50 hover:text-red-500 transition-colors rounded-xl"
          onClick={() => { onLogout(); navigate('/'); }}>
          <LogOut size={16} />
          <span className="text-sm font-semibold hidden sm:inline-block">Logout</span>
        </button>
      </div>
    </nav>
  );
}
