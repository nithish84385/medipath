import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileText,
} from 'lucide-react';

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    markerClass: 'border-emerald-200 bg-emerald-50',
    cardClass: 'border-slate-200 bg-white hover:border-emerald-200',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-700',
    markerClass: 'border-amber-200 bg-amber-50',
    cardClass: 'border-amber-200 bg-amber-50/60 hover:border-amber-300',
  },
  normal: {
    icon: CircleDot,
    iconClass: 'text-slate-500',
    badgeClass: 'border border-slate-200 bg-slate-50 text-slate-600',
    markerClass: 'border-slate-200 bg-white',
    cardClass: 'border-slate-200 bg-white hover:border-slate-300',
  },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.normal;
}

function getMetaLabel(type) {
  if (type === 'success') return 'Completed';
  if (type === 'warning') return 'Needs attention';
  return 'Recorded';
}

export default function PatientTimeline({ timeline = [] }) {
  if (!timeline.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <FileText className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Patient Timeline</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Key care milestones will appear here once the patient journey begins.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
            <CalendarClock className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">No clinical events yet</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Select a patient or complete the next step to build a clear treatment history.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <CalendarClock className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Patient Timeline</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Chronological care context designed for quick clinical review.
          </p>
        </div>
      </div>

      <ol className="relative">
        {timeline.map((item, index) => {
          const style = getTypeStyle(item.type);
          const Icon = style.icon;
          const isLast = index === timeline.length - 1;

          return (
            <li key={`${item.date}-${item.title}-${index}`} className="relative pl-10 sm:pl-44">
              {!isLast && (
                <span
                  className="absolute left-[0.95rem] top-10 h-[calc(100%-1.25rem)] w-px bg-slate-200 sm:left-[10.95rem]"
                  aria-hidden="true"
                />
              )}

              <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 sm:absolute sm:left-0 sm:top-1 sm:w-36 sm:text-right">
                {item.date}
              </div>

              <div
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm sm:left-36 ${style.markerClass}`}
                aria-hidden="true"
              >
                <Icon className={`h-4 w-4 ${style.iconClass}`} />
              </div>

              <article
                className={`mb-4 rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${style.cardClass}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 sm:text-[15px]">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${style.badgeClass}`}>
                        {item.label || getMetaLabel(item.type)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>

                  {item.meta ? (
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      {item.meta}
                    </div>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
