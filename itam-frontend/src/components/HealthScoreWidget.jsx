import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ShieldCheck, Shield, AlertTriangle, Calendar, Award } from 'lucide-react';

const HealthScoreWidget = ({ healthData, currency = 'VND' }) => {
  const { t, i18n } = useTranslation();

  if (!healthData) return null;

  const { finalScore, healthCondition, currentDepreciatedValue, projectedReplacementDate, factors, appliedPolicyName, appliedWeights } = healthData;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '\u2014';
    return new Intl.NumberFormat(i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '\u2014';
    try {
      return new Intl.DateTimeFormat(i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const gaugeData = [
    { name: 'Score', value: finalScore },
    { name: 'Remaining', value: 100 - finalScore }
  ];

  const getColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(finalScore);

  const getIcon = () => {
    if (healthCondition === 'GOOD') return <ShieldCheck className="w-7 h-7 text-emerald-500" />;
    if (healthCondition === 'FAIR') return <Shield className="w-7 h-7 text-amber-500" />;
    return <AlertTriangle className="w-7 h-7 text-red-500" />;
  };

  const getConditionLabel = () => {
    if (healthCondition === 'GOOD') return t('assetHealth.conditionGood', 'Good');
    if (healthCondition === 'FAIR') return t('assetHealth.conditionFair', 'Fair');
    return t('assetHealth.conditionCritical', 'Critical');
  };

  const wAge = appliedWeights?.age != null ? appliedWeights.age : 30;
  const wWarranty = appliedWeights?.warranty != null ? appliedWeights.warranty : 20;
  const wIncident = appliedWeights?.incident != null ? appliedWeights.incident : 30;
  const wCondition = appliedWeights?.condition != null ? appliedWeights.condition : 20;

  const isSoftwareExcluded = appliedPolicyName && (appliedPolicyName.includes("Không áp dụng") || (wAge === 0 && wWarranty === 0 && wIncident === 0 && wCondition === 0));

  const radarData = factors ? [
    { subject: `${t('assetHealth.factorAge', 'Age')} (${wAge}%)`,         A: factors.ageFactor,        fullMark: 100 },
    { subject: `${t('assetHealth.factorWarranty', 'Warranty')} (${wWarranty}%)`, A: factors.warrantyFactor, fullMark: 100 },
    { subject: `${t('assetHealth.factorIncident', 'Incidents')} (${wIncident}%)`, A: factors.incidentFactor, fullMark: 100 },
    { subject: `${t('assetHealth.factorCondition', 'Condition')} (${wCondition}%)`, A: factors.conditionFactor, fullMark: 100 },
  ] : [];

  const factorBars = factors ? [
    { label: `${t('assetHealth.factorAge', 'Age')} (${wAge}%)`,           value: factors.ageFactor,        barColor: '#6366f1' },
    { label: `${t('assetHealth.factorWarranty', 'Warranty')} (${wWarranty}%)`, value: factors.warrantyFactor,   barColor: '#3b82f6' },
    { label: `${t('assetHealth.factorIncident', 'Incidents')} (${wIncident}%)`, value: factors.incidentFactor,  barColor: '#f59e0b' },
    { label: `${t('assetHealth.factorCondition', 'Condition')} (${wCondition}%)`, value: factors.conditionFactor, barColor: '#10b981' },
  ] : [];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">
          {t('assetHealth.title')}
        </h3>
        {appliedPolicyName && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60" title="Chính sách chấm điểm được áp dụng">
            <Award className="w-3.5 h-3.5" />
            {appliedPolicyName}
          </span>
        )}
      </div>

      {isSoftwareExcluded ? (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">{t('assetHealth.softwareExcludedTitle', 'Tài sản Phần mềm / Giấy phép')}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t('assetHealth.softwareExcludedDesc', 'Phần mềm không áp dụng tính điểm khấu hao vật lý hay sự cố phần cứng theo tiêu chuẩn Enterprise Gold Standard.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Gauge + info */}
          <div className="flex flex-col items-center gap-4 md:border-r border-slate-100 dark:border-slate-700">
            <div className="relative w-48 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={58}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={color} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span className="text-4xl font-extrabold leading-none" style={{ color }}>{finalScore}</span>
                <span className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                  {getConditionLabel()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 w-full">
              {getIcon()}
              <div className="text-sm flex-1">
                <p className="text-slate-500 dark:text-slate-400 text-xs">{t('assetHealth.currentValue')}</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(currentDepreciatedValue || 0)}</p>
              </div>
            </div>

            {projectedReplacementDate && (
              <div className="flex items-center gap-3 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="text-xs">
                  <p className="text-slate-500 dark:text-slate-400">{t('assetHealth.projectedReplacement', 'Projected replacement')}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(projectedReplacementDate)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Radar */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('assetHealth.factorBreakdown')}
            </p>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke={color} fill={color} fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(val) => [`${Math.round(val)}/100`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Factor breakdown */}
            <div className="space-y-2.5">
              {factorBars.map((f) => (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{f.label}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.round(f.value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, f.value)}%`, backgroundColor: f.barColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthScoreWidget;
