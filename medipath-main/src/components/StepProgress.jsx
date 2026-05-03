import { Check } from 'lucide-react';

const PATIENT_STEPS = ['Doctor Match', 'Medications', 'Recovery'];
const DOCTOR_STEPS = ['Prescribe', 'Set Timings', 'Diet Plan'];

export default function StepProgress({ current, role }) {
  const steps = role === 'doctor' ? DOCTOR_STEPS : PATIENT_STEPS;

  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        const classes = [
          'step-item',
          done ? 'done' : '',
          active ? 'active' : '',
        ].filter(Boolean).join(' ');

        return (
          <div className={classes} key={i}>
            <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
              {done ? <Check size={14} strokeWidth={3} /> : idx}
            </div>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
