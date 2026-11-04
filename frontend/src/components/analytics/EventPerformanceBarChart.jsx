import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import EmptyState from '../common/EmptyState';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const event = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-4 py-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[180px]">
        <p className="font-bold text-white border-b border-slate-800 pb-1.5">{event.title}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              Venue Capacity:
            </span>
            <span className="font-semibold text-white">{event.capacity}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              Registered:
            </span>
            <span className="font-semibold text-white">{event.registeredCount}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Attended:
            </span>
            <span className="font-semibold text-white">{event.presentCount || 0}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const EventPerformanceBarChart = ({ data = [], height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Events Data"
        description="Event performance metrics will display once events are scheduled."
        className="py-10"
      />
    );
  }

  // Format short label for X-axis
  const formattedData = data.map((ev) => ({
    ...ev,
    shortTitle: ev.title && ev.title.length > 14 ? `${ev.title.substring(0, 12)}…` : ev.title
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="shortTitle"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
          />
          <Bar
            dataKey="capacity"
            name="Capacity"
            fill="#475569"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="registeredCount"
            name="Registrations"
            fill="#38bdf8"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="presentCount"
            name="Attended"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventPerformanceBarChart;
