import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import EmptyState from '../common/EmptyState';
import { PieChart as PieIcon } from 'lucide-react';

const PALETTE = [
  '#6366f1', // Indigo
  '#38bdf8', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#14b8a6'  // Teal
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-white flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: payload[0].fill }}
          />
          {data.name}
        </p>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Total Count:</span>
          <span className="font-semibold text-white">{data.count}</span>
        </div>
        {data.percentage !== undefined && (
          <div className="flex items-center justify-between gap-4 text-slate-400">
            <span>Share:</span>
            <span className="font-semibold text-indigo-400">{data.percentage}%</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const CategoryPieChart = ({
  data = [],
  title = 'Category Distribution',
  height = 260,
  innerRadius = 55,
  outerRadius = 85
}) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No Category Data"
        description="Participation and event categories will populate as events are registered."
        className="py-10"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="count"
              stroke="#0f172a"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PALETTE[index % PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Badge Grid */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800/60">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px]"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
            />
            <span className="text-slate-300 truncate max-w-[100px]">{item.name}</span>
            <span className="text-slate-400 font-semibold">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPieChart;
