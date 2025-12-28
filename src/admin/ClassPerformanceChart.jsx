import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

export default function ClassPerformanceChart({ data }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow border border-gray-200">
      <h3 className="font-serif text-xl font-semibold text-navy mb-4">
        Class Performance
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />

          {/* Risk zones */}
          <ReferenceArea y1={0} y2={49} fill="#ef4444" fillOpacity={0.12} />
          <ReferenceArea y1={50} y2={69} fill="#facc15" fillOpacity={0.12} />
          <ReferenceArea y1={70} y2={100} fill="#22c55e" fillOpacity={0.12} />

          <Line
            type="monotone"
            dataKey="average"
            stroke="#c9a227"
            strokeWidth={3}
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
