import { useState, useEffect } from 'react';
import { Trophy, Medal, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axiosClient from '../services/axiosClient';

const LeaderboardWidget = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axiosClient.get('/users/leaderboard');
        setLeaderboard(res || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-slate-400">{index + 1}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('dashboard.leaderboard')}
        </h3>
      </div>
      
      <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                </div>
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{t('dashboard.noData')}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {leaderboard.map((user, index) => (
              <li key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow-sm">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.departmentName || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {user.careScore}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{t('dashboard.points')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
