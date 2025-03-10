'use client';

import { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SmokingEvent = {
  timestamp: string;
};

type CigaretteSettings = {
  brand: string;
  tar: number;
  nicotine: number;
};

export default function Home() {
  const [events, setEvents] = useState<SmokingEvent[]>([]);
  const [settings, setSettings] = useState<CigaretteSettings>({
    brand: '',
    tar: 0,
    nicotine: 0,
  });
  const [manualTimestamp, setManualTimestamp] = useState<string>('');
  const [bulkImportText, setBulkImportText] = useState<string>('');

  // グラフビューの切り替え用
  const [selectedGraph, setSelectedGraph] = useState<string>('daily_count');
  // 時間別グラフで選択する対象日（グループ化した日付）
  const [selectedDay, setSelectedDay] = useState<string>('');

  // 初回レンダリング時に API 経由でデータを読み込み
  useEffect(() => {
    fetchEvents();
    fetchSettings();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/smoking');
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/cigarette');
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
  };

  // API 経由でイベントを保存（CSV 書き換え）
  const saveEvents = async (newEvents: SmokingEvent[]) => {
    const res = await fetch('/api/smoking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: newEvents }),
    });
    if (res.ok) {
      setEvents(newEvents);
    }
  };

  // API 経由で設定を保存（CSV 書き換え）
  const saveSettings = async (newSettings: CigaretteSettings) => {
    const res = await fetch('/api/cigarette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      setSettings(newSettings);
    }
  };

  // 「喫煙」ボタン：現在時刻のイベントを保存
  const handleSmokingButton = () => {
    const newEvent: SmokingEvent = { timestamp: new Date().toISOString() };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
  };

  // 手動入力フォーム送信
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTimestamp) return;
    const newEvent: SmokingEvent = { timestamp: new Date(manualTimestamp).toISOString() };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
    setManualTimestamp('');
  };

  // タバコ設定フォーム送信
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
  };

  // 各イベントを JST（UTC+9）に変換し、6時未満なら前日扱いにするグループ化
  const groupEventsByDay = () => {
    const groups: { [day: string]: SmokingEvent[] } = {};
    events.forEach((event) => {
      const eventDate = new Date(event.timestamp);
      const jstDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000);
      if (jstDate.getHours() < 6) {
        jstDate.setDate(jstDate.getDate() - 1);
      }
      // 日付部分（YYYY-MM-DD）
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

  // 時間別グラフで日付が未選択の場合、最新の日付を自動選択
  useEffect(() => {
    if (selectedGraph === 'time_of_day' && sortedDays.length > 0 && !selectedDay) {
      setSelectedDay(sortedDays[sortedDays.length - 1]);
    }
  }, [selectedGraph, sortedDays, selectedDay]);

  // 日別集計用グラフデータ
  let aggregatedData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  } = { labels: sortedDays, datasets: [] };
  if (selectedGraph === 'daily_count') {
    aggregatedData = {
      labels: sortedDays,
      datasets: [
        {
          label: '本数',
          data: sortedDays.map((day) => groups[day].length),
          backgroundColor: 'rgba(75,192,192,0.6)',
        },
      ],
    };
  } else if (selectedGraph === 'daily_nicotine') {
    aggregatedData = {
      labels: sortedDays,
      datasets: [
        {
          label: 'ニコチン (mg)',
          data: sortedDays.map((day) => groups[day].length * (settings.nicotine || 0)),
          backgroundColor: 'rgba(153,102,255,0.6)',
        },
      ],
    };
  } else if (selectedGraph === 'daily_tar') {
    aggregatedData = {
      labels: sortedDays,
      datasets: [
        {
          label: 'タール (mg)',
          data: sortedDays.map((day) => groups[day].length * (settings.tar || 0)),
          backgroundColor: 'rgba(255,159,64,0.6)',
        },
      ],
    };
  }

  // 時間別グラフ用データ（対象日の各時間帯ごとの本数を集計）
  let timeOfDayData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
    }[];
  } | null = null;
  if (selectedGraph === 'time_of_day' && selectedDay && groups[selectedDay]) {
    // 24 時間分のビン（0～23: 0が6:00 JSTに相当、5が5:00 JST）
    const bins = new Array(24).fill(0);
    // 選択日の6:00〜翌日の6:00を対象とする
    const selectedDayStart = new Date(selectedDay + 'T06:00:00+09:00');
    const nextDayStart = new Date(selectedDayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    const targetEvents = events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= selectedDayStart && eventDate < nextDayStart;
    });

    targetEvents.forEach((event) => {
      const eventDate = new Date(event.timestamp);
      const hour = eventDate.getHours();
      // 6 時を 0 とする相対時間
      const relativeHour = (hour + 18) % 24;
      bins[relativeHour]++;
    });
    const labels = [
      "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17",
      "18", "19", "20", "21", "22", "23", "0", "1", "2", "3", "4", "5"
    ];
    timeOfDayData = {
      labels,
      datasets: [
        {
          label: '本数',
          data: bins,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
      ],
    };
  }

  // 一括入力フォーム送信（過去の記録のインポート）  
  // 入力例：1行につき「YYYY-MM-DD, 本数」
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkImportText) return;
    const lines = bulkImportText.split('\n');
    const newEvents = [...events];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(',');
      if (parts.length !== 2) return;
      const dateStr = parts[0].trim();
      const count = parseInt(parts[1].trim(), 10);
      if (!dateStr || isNaN(count)) return;
      // 各記録はデフォルトで12:00 JST（ローカルタイムとして解釈）を設定
      for (let i = 0; i < count; i++) {
        const dt = new Date(dateStr + 'T12:00:00');
        newEvents.push({ timestamp: dt.toISOString() });
      }
    });
    saveEvents(newEvents);
    setBulkImportText('');
  };

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
            value={manualTimestamp}
            onChange={(e) => setManualTimestamp(e.target.value)}
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
              value={settings.brand}
              onChange={(e) => setSettings({ ...settings, brand: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold">タール (mg):</label>
            <input
              type="number"
              value={settings.tar || ''}
              placeholder='0'
              onChange={(e) => setSettings({ ...settings, tar: Number(e.target.value) })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block font-semibold">ニコチン (mg):</label>
            <input
              type="number"
              value={settings.nicotine || ''}
              placeholder='0'
              onChange={(e) => setSettings({ ...settings, nicotine: Number(e.target.value) })}
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
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
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
            value={selectedGraph}
            onChange={(e) => { setSelectedGraph(e.target.value); setSelectedDay(''); }}
            className="select select-bordered w-full max-w-xs"
          >
            <option value="daily_count">日別本数</option>
            <option value="daily_nicotine">日別ニコチン</option>
            <option value="daily_tar">日別タール</option>
            <option value="time_of_day">時間別本数 (一日)</option>
          </select>
        </div>

        {selectedGraph === 'time_of_day' && (
          <div className="mb-4">
            <label className="mr-2 font-semibold">日付選択:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
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
          {selectedGraph === 'time_of_day' && timeOfDayData ? (
            <Bar
              data={timeOfDayData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: `時間別本数 (${selectedDay})` },
                },
                scales: {
                  x: {
                    ticks: {
                      maxRotation: 0,
                      minRotation: 0,
                      font: {
                        size: 10
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <Bar
              data={aggregatedData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: '日別集計' },
                },
                scales: {
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      font: {
                        size: 10
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
