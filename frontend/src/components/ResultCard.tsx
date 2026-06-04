import React from 'react'
import { CheckCircle2, BarChart3, Clock, Brain } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface PredictionData {
  clase_predicha: string
  probabilidad_maxima: number
  probabilidades_totales: Record<string, number>
  tiempo_inferencia: number
  model_name: string
}

interface ResultCardProps {
  prediction: PredictionData
  darkMode?: boolean
}

export const ResultCard: React.FC<ResultCardProps> = ({ prediction, darkMode = true }) => {
  // Format data for Recharts, sorting from highest to lowest probability
  const chartData = Object.entries(prediction.probabilidades_totales)
    .map(([name, value]) => ({
      name,
      probability: value
    }))
    .sort((a, b) => b.probability - a.probability)

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{payload[0].payload.name}</p>
          <p className="text-xs font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">
            {payload[0].value.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-300">
      
      {/* Primary Highlight Card */}
      <div className="bg-gradient-to-br from-indigo-50/50 dark:from-indigo-900/30 via-violet-50/40 dark:via-violet-900/25 to-slate-50/10 dark:to-slate-900/10 border border-violet-100 dark:border-violet-500/20 rounded-3xl p-5 flex gap-4 items-center relative overflow-hidden shadow-lg">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-600/10 blur-xl pointer-events-none"></div>

        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center shadow-inner shrink-0">
          <CheckCircle2 className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <span className="text-[10px] font-black tracking-wider text-violet-600 dark:text-violet-400 uppercase">Clase Detectada</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">{prediction.clase_predicha}</h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-slate-650 dark:text-slate-300">
            <span className="text-xs font-bold flex items-center gap-1">
              Confianza: <span className="text-violet-600 dark:text-violet-400">{prediction.probabilidad_maxima.toFixed(2)}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Inference Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/15 p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-500">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Inferencia</span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              {prediction.tiempo_inferencia.toFixed(1)} ms
            </p>
          </div>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/15 p-3.5 flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-500">
            <Brain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Modelo</span>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
              EfficientNetB0
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart (Recharts) */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800/30 p-5 space-y-4 shadow-md">
        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          Distribución de Categorías
        </h4>
        
        {/* Recharts Wrapper */}
        <div className="h-[260px] w-full text-[10px] font-semibold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                stroke={darkMode ? '#64748b' : '#94a3b8'} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => `${tick}%`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke={darkMode ? '#94a3b8' : '#475569'} 
                tickLine={false} 
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
              <Bar 
                dataKey="probability" 
                radius={[0, 4, 4, 0]}
                barSize={12}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#8b5cf6' : (darkMode ? '#475569' : '#cbd5e1')} 
                    opacity={index === 0 ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
