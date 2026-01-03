'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ProgressData = {
  date: string;
  workoutCount: number;
  totalVolume: number;
};

export default function ProgressChart() {
  const [data, setData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        setIsDark(
          document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
        );
      }
    };
    
    checkDarkMode();
    
    // Watch for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    // Watch for class changes
    const observer = new MutationObserver(checkDarkMode);
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    
    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      observer.disconnect();
    };
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/workouts/progress?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
      
      const progressData = await response.json();
      setData(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [period]);

  const formatDate = (dateStr: string) => {
    // Handle both string dates and Date objects
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    // Ensure we're working with a valid date
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    if (period === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === '3months' || period === '6months') {
      // For 3-6 months, show month and day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // For year, show just month
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
  };

  // Calculate chart height and X-axis settings based on period
  const getChartConfig = () => {
    switch (period) {
      case 'week':
        return {
          height: 300,
          bottomMargin: 0,
          angle: 0,
          interval: 0,
        };
      case 'month':
        return {
          height: 350,
          bottomMargin: 40,
          angle: -45,
          interval: 2, // Show every 2nd label
        };
      case '3months':
        return {
          height: 400,
          bottomMargin: 60,
          angle: -45,
          interval: 5, // Show every 5th label
        };
      case '6months':
        return {
          height: 450,
          bottomMargin: 60,
          angle: -45,
          interval: 10, // Show every 10th label
        };
      case 'year':
        return {
          height: 500,
          bottomMargin: 60,
          angle: -45,
          interval: 30, // Show approximately monthly
        };
      default:
        return {
          height: 300,
          bottomMargin: 0,
          angle: 0,
          interval: 0,
        };
    }
  };


  const chartConfig = getChartConfig();

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    fullDate: item.date,
    workouts: item.workoutCount,
    volume: Math.round(item.totalVolume),
  }));

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (data.length === 0 || chartData.every(item => item.workouts === 0)) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Workout Progress</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === 'week'
                  ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === 'month'
                  ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setPeriod('3months')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === '3months'
                  ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setPeriod('6months')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === '6months'
                  ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                period === 'year'
                  ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Year
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            No workout data available for this period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">Workout Progress</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              period === 'week'
                ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              period === 'month'
                ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setPeriod('3months')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              period === '3months'
                ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setPeriod('6months')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              period === '6months'
                ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              period === 'year'
                ? 'bg-black dark:bg-zinc-50 text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            Year
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={chartConfig.height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: chartConfig.bottomMargin }}
        >
          <defs>
            <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#fafafa" : "#000000"} stopOpacity={0.8} />
              <stop offset="95%" stopColor={isDark ? "#fafafa" : "#000000"} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#3f3f46" : "#e4e4e7"} />
          <XAxis 
            dataKey="date" 
            stroke={isDark ? "#a1a1aa" : "#71717a"}
            tick={{ 
              fill: isDark ? "#a1a1aa" : "#71717a",
              angle: chartConfig.angle,
              textAnchor: chartConfig.angle < 0 ? 'end' : 'middle',
              fontSize: 12,
            }}
            interval={chartConfig.interval}
          />
          <YAxis 
            stroke={isDark ? "#a1a1aa" : "#71717a"}
            tick={{ fill: isDark ? "#a1a1aa" : "#71717a" }}
            tickFormatter={(value: number) => value.toString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#18181b" : "#ffffff",
              border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
              borderRadius: '8px',
            }}
            content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <p style={{ 
                      color: isDark ? "#fafafa" : "#18181b",
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      {(() => {
                        const dataPoint = chartData.find(d => d.date === data.date);
                        if (dataPoint?.fullDate) {
                          const date = new Date(dataPoint.fullDate);
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }
                        return data.date;
                      })()}
                    </p>
                    <p style={{ 
                      color: isDark ? "#fafafa" : "#18181b",
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontWeight: '600' }}>Workouts: </span>
                      {data.workouts === 0 ? 'No workouts' : `${data.workouts} ${data.workouts === 1 ? 'workout' : 'workouts'}`}
                    </p>
                    <p style={{ 
                      color: isDark ? "#fafafa" : "#18181b"
                    }}>
                      <span style={{ fontWeight: '600' }}>Volume: </span>
                      {data.volume.toLocaleString()} lbs
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="workouts"
            stroke={isDark ? "#fafafa" : "#000000"}
            fillOpacity={1}
            fill="url(#colorWorkouts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

