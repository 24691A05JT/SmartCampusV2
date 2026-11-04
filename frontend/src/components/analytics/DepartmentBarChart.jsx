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
import { Building2 } from 'lucide-react';

const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication': 'ECE',
  'Mechanical Engineering': 'MECH',
  'Civil Engineering': 'CIVIL',
  'Information Technology': 'IT',
  'Electrical Engineering': 'EEE',
  'Business Administration': 'MBA',
  'Administration': 'Admin'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px]">
        <p className="font-bold text-white border-b border-slate-800 pb-1">{item.department}</p>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Enrolled Students:
          </span>
          <span className="font-semibold text-white">{item.studentCount}</span>
        </div>
        {item.registrationCount !== undefined && (
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              Event Registrations:
            </span>
            <span className="font-semibold text-white">{item.registrationCount}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const DepartmentBarChart = ({ data = [], height = 260 }) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No Department Data"
        description="Department distribution will appear as students and events are registered."
        className="py-10"
      />
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    abbr: DEPT_ABBR[d.department] || (d.department.length > 10 ? `${d.department.substring(0, 8)}…` : d.department)
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="abbr"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
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
            dataKey="studentCount"
            name="Students"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="registrationCount"
            name="Registrations"
            fill="#38bdf8"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentBarChart;
