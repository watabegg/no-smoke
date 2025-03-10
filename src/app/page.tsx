'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SmokingEvent = {
  id: number;
  timestamp: string;
};

type CigaretteSettings = {
  id: number;
  brand: string;
  tar: number;
  nicotine: number;
};

type AppState = {
  smokingEvents: SmokingEvent[];
  cigaretteSettings: CigaretteSettings;
  ui: {
    manualTimestamp: string;
    bulkImportText: string;
    selectedGraph: 'daily_count' | 'daily_nicotine' | 'daily_tar' | 'time_of_day';
    selectedDay: string;
  };
};

export default function Home() {
  const [state, setState] = useState<AppState>({
    smokingEvents: [],
    cigaretteSettings: {
      id: 0,
      brand: '',
      tar: 0,
      nicotine: 0,
    },
    ui: {
      manualTimestamp: '',
      bulkImportText: '',
      selectedGraph: 'daily_count',
      selectedDay: '',
    }
  });

  // Destructured state for easier access
  const { smokingEvents, cigaretteSettings, ui } = state;

  // API handlers
  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, settingsRes] = await Promise.all([
        fetch('/api/smoking'),
        fetch('/api/cigarette')
      ]);
      
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      if (!settingsRes.ok) throw new Error('Failed to fetch settings');
      
      const events = await eventsRes.json();
      const settings = await settingsRes.json();
      
      setState(prev => ({
        ...prev,
        smokingEvents: events,
        cigaretteSettings: settings
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  const saveSmokingEvent = useCallback(async (timestamp: string) => {
    try {
      const res = await fetch('/api/smoking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp }),
      });
      
      if (!res.ok) throw new Error('Failed to save event');
      
      // Refetch all data to ensure we have the latest
      await fetchData();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }, [fetchData]);

  const saveCigaretteSettings = useCallback(async () => {
    try {
      const { id, ...settingsData } = cigaretteSettings;
      const res = await fetch('/api/cigarette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      await fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [cigaretteSettings, fetchData]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // UI action handlers
  const handleSmokingButton = () => {
    saveSmokingEvent(new Date().toISOString());
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.manualTimestamp) return;
    saveSmokingEvent(new Date(ui.manualTimestamp).toISOString());
    setState(prev => ({
      ...prev, 
      ui: { ...prev.ui, manualTimestamp: '' }
    }));
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCigaretteSettings();
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.bulkImportText) return;
    
    const lines = ui.bulkImportText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const parts = trimmed.split(',');
      if (parts.length !== 2) continue;
      
      const dateStr = parts[0].trim();
      const count = parseInt(parts[1].trim(), 10);
      if (!dateStr || isNaN(count)) continue;

      // Save each smoking event for the count
      for (let i = 0; i < count; i++) {
        const dt = new Date(dateStr + 'T12:00:00');
        await saveSmokingEvent(dt.toISOString());
      }
    }

    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, bulkImportText: '' }
    }));
  };

  // Data processing for charts
  const groupEventsByDay = () => {
    const groups: { [day: string]: SmokingEvent[] } = {};
    smokingEvents.forEach((event) => {
      const jstDate = new Date(event.timestamp);
      if (jstDate.getHours() < 6) {
        jstDate.setDate(jstDate.getDate() - 1);
      }
      const dayStr = jstDate.toISOString().split('T')[0];
      if (!groups[dayStr]) {
        groups[dayStr] = [];
      }
      groups[dayStr].push(event);
    });
    return groups;
  };

  const groups = groupEventsByDay();
  const sortedDays = Object.keys(groups).sort();

  // Select latest day when viewing time of day chart
  useEffect(() => {
    if (ui.selectedGraph === 'time_of_day' && sortedDays.length > 0 && !ui.selectedDay) {
      setState(prev => ({
        ...prev,
        ui: { ...prev.ui, selectedDay: sortedDays[sortedDays.length - 1] }
      }));
    }
  }, [ui.selectedGraph, ui.selectedDay, sortedDays]);

  // Chart data preparation
  const getChartData = () => {
    if (ui.selectedGraph === 'time_of_day' && ui.selectedDay && groups[ui.selectedDay]) {
      // Time of day chart
      const bins = new Array(24).fill(0);
      const selectedDayStart = new Date(ui.selectedDay + 'T06:00:00+09:00');
      const nextDayStart = new Date(selectedDayStart);
      nextDayStart.setDate(nextDayStart.getDate() + 1);
      
      const targetEvents = smokingEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        const jstEventDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000);
        return jstEventDate >= selectedDayStart && jstEventDate < nextDayStart;
      });

      targetEvents.forEach((event) => {
        const eventDate = new Date(event.timestamp);
        const hour = eventDate.getHours();
        const relativeHour = (hour + 18) % 24;
        bins[relativeHour]++;
      });
      
      const labels = [
        "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17",
        "18", "19", "20", "21", "22", "23", "0", "1", "2", "3", "4", "5"
      ];
      
      return {
        labels,
        datasets: [
          {
            label: '本数',
            data: bins,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
        ],
      };
    } else {
      // Daily aggregated charts
      let data;
      switch (ui.selectedGraph) {
        case 'daily_nicotine':
          data = {
            label: 'ニコチン (mg)',
            data: sortedDays.map((day) => groups[day].length * (cigaretteSettings.nicotine || 0)),
            backgroundColor: 'rgba(153,102,255,0.6)',
          };
          break;
        case 'daily_tar':
          data = {
            label: 'タール (mg)',
            data: sortedDays.map((day) => groups[day].length * (cigaretteSettings.tar || 0)),
            backgroundColor: 'rgba(255,159,64,0.6)',
          };
          break;
        default: // daily_count
          data = {
            label: '本数',
            data: sortedDays.map((day) => groups[day].length),
            backgroundColor: 'rgba(75,192,192,0.6)',
          };
      }
      
      return {
        labels: sortedDays,
        datasets: [data],
      };
    }
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen p-4 items-center flex flex-col space-y-4">
      <h1 className="text-3xl font-bold mb-4">わたべの禁煙・減煙アプリ</h1>

      {/* 喫煙ボタン */}
      <div className="my-6">
        <button
          onClick={handleSmokingButton}
          className="btn btn-error btn-xl"
        >
          喫煙
        </button>
      </div>

      {/* 手動入力フォーム */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">手動入力</h2>
        <form onSubmit={handleManualSubmit} className="flex items-center space-x-2">
          <input
            type="datetime-local"
            value={ui.manualTimestamp}
            onChange={(e) => setState(prev => ({
              ...prev,
              ui: { ...prev.ui, manualTimestamp: e.target.value }
            }))}
            className="border rounded px-2 py-1"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            保存
          </button>
        </form>
      </div>

      {/* タバコ設定フォーム */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">タバコの設定</h2>
        <form onSubmit={handleSettingsSubmit} className="space-y-2">
          <div>
            <label className="block font-semibold">銘柄:</label>
            <input
              type="text"
              value={cigaretteSettings.brand}
              onChange={(e) => setState(prev => ({
                ...prev,
                cigaretteSettings: { ...prev.cigaretteSettings, brand: e.target.value }
              }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold">タール (mg):</label>
            <input
              type="number"
              value={cigaretteSettings.tar || ''}
              placeholder='0'
              onChange={(e) => setState(prev => ({
                ...prev,
                cigaretteSettings: { ...prev.cigaretteSettings, tar: Number(e.target.value) }
              }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold">ニコチン (mg):</label>
            <input
              type="number"
              value={cigaretteSettings.nicotine || ''}
              placeholder='0'
              onChange={(e) => setState(prev => ({
                ...prev,
                cigaretteSettings: { ...prev.cigaretteSettings, nicotine: Number(e.target.value) }
              }))}
              className="input w-full"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
          >
            保存
          </button>
        </form>
      </div>

      {/* 一括入力フォーム */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">一括入力 (過去の記録のインポート)</h2>
        <form onSubmit={handleBulkImport} className="space-y-2">
          <textarea
            value={ui.bulkImportText}
            onChange={(e) => setState(prev => ({
              ...prev,
              ui: { ...prev.ui, bulkImportText: e.target.value }
            }))}
            placeholder="YYYY-MM-DD, 本数&#10;例: 2023-03-15, 5"
            className="border rounded px-2 py-1 w-full h-24"
          />
          <button
            type="submit"
            className="btn btn-accent font-bold py-2 px-4 rounded"
          >
            インポート
          </button>
        </form>
      </div>

      {/* グラフ表示セクション */}
      <div className="mb-6 w-full">
        <h2 className="text-xl font-bold mb-2">グラフ表示</h2>
        <div className="mb-4">
          <select
            value={ui.selectedGraph}
            onChange={(e) => setState(prev => ({
              ...prev, 
              ui: { 
                ...prev.ui, 
                selectedGraph: e.target.value as AppState['ui']['selectedGraph'],
                selectedDay: ''
              }
            }))}
            className="select select-bordered w-full max-w-xs"
          >
            <option value="daily_count">日別本数</option>
            <option value="daily_nicotine">日別ニコチン</option>
            <option value="daily_tar">日別タール</option>
            <option value="time_of_day">時間別本数 (一日)</option>
          </select>
        </div>

        {ui.selectedGraph === 'time_of_day' && (
          <div className="mb-4">
            <label className="mr-2 font-semibold">日付選択:</label>
            <select
              value={ui.selectedDay}
              onChange={(e) => setState(prev => ({
                ...prev,
                ui: { ...prev.ui, selectedDay: e.target.value }
              }))}
              className="select select-bordered w-full max-w-xs"
            >
              {sortedDays.map(day => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white p-4 rounded shadow w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '300px' }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: { 
                  display: true, 
                  text: ui.selectedGraph === 'time_of_day' 
                    ? `時間別本数 (${ui.selectedDay})` 
                    : '日別集計' 
                },
              },
              scales: {
                x: {
                  ticks: {
                    maxRotation: ui.selectedGraph === 'time_of_day' ? 0 : 45,
                    minRotation: ui.selectedGraph === 'time_of_day' ? 0 : 45,
                    font: { size: 10 }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* データ表示 */}
      <div className="w-full">
        <h2 className="text-xl font-bold mb-2">データ表示</h2>
        <div className="bg-white p-4 rounded shadow w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '300px', overflowY: 'auto' }}>
          <table className="table w-full">
            <thead>
              <tr>
                <th>日付</th>
                <th>時間</th>
                <th>銘柄</th>
              </tr>
            </thead>
            <tbody>
              {smokingEvents.map(event => (
                <tr key={event.id}>
                    <td>{format(new Date(event.timestamp), 'yyyy年MM月dd日', { locale: ja })}</td>
                    <td>{format(new Date(event.timestamp), 'HH:mm:ss', { locale: ja })}</td>
                  <td>{cigaretteSettings.brand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
