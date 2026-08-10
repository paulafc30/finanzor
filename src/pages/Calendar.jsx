import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import MonthCalendar from '../components/calendar/MonthCalendar.jsx';
import WeekCalendar from '../components/calendar/WeekCalendar.jsx';
import DayDetailModal from '../components/calendar/DayDetailModal.jsx';
import { useMonth } from '../hooks/useMonth.jsx';

export default function CalendarPage() {
  const { t } = useTranslation('calendar');
  const [selectedDay, setSelectedDay] = useState(null);
  const { isYearView, setViewMode } = useMonth();
  const [calView, setCalView] = useState('month');
  const [weekAnchor, setWeekAnchor] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  );

  if (isYearView) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-info" />
          <h1 className="text-xl font-semibold">{t('title')}</h1>
        </div>
        <div className="rounded-xl bg-bg-elevated p-6 text-center ring-1 ring-white/5">
          <CalendarRange size={32} className="mx-auto mb-3 text-white/40" />
          <p className="text-white">{t('yearView.monthOnly')}</p>
          <p className="mt-1 text-sm text-white/60">
            {t('yearView.switchHint')}
          </p>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
            {t('yearView.switchButton')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-2"
      style={{ height: 'calc(100dvh - 163px)' }}>
      {/* height = 100dvh - header(43px) - main pt-4(16px) - main pb-24(96px) - 8px buffer */}

      {/* Header con toggle Mes / Semana */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="shrink-0 text-info" />
          <h1 className="text-lg font-semibold">{t('title')}</h1>
        </div>

        <div className="flex rounded-lg bg-bg-elevated p-0.5">
          {[
            { id: 'month', label: t('viewMonth') },
            { id: 'week', label: t('viewWeek') },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCalView(id)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                calView === id
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/70',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendario — ocupa todo el espacio restante */}
      {calView === 'month' ? (
        <MonthCalendar
          className="min-h-0 flex-1"
          onDayClick={(key) => setSelectedDay(key)}
        />
      ) : (
        <WeekCalendar
          weekAnchor={weekAnchor}
          onWeekChange={setWeekAnchor}
          onDayClick={(key) => setSelectedDay(key)}
        />
      )}

      <DayDetailModal
        dayKey={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </section>
  );
}
