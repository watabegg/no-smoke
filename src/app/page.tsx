'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { AppState } from '@/types';
import { groupEventsByDay, getLast30DaysData, getChartData } from '@/utils/chartUtils';

// コンポーネントのインポート
import Header from '@/components/Header';
import HealthStatus from '@/components/HealthStatus';
import TabNavigation from '@/components/TabNavigation';
import RecordTab from '@/components/RecordTab';
import StatsTab from '@/components/StatsTab';
import SettingsTab from '@/components/SettingsTab';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

export default function Home() {
  const [state, setState] = useState<AppState>({
    smokingEvents: [],
    cigaretteSettings: null,
    ui: {
      manualTimestamp: '',
      bulkImportText: '',
      selectedGraph: 'daily_count',
      selectedDay: '',
      activeTab: 'record',
      showHealthBenefits: false,
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

  // 既存のデータを更新する関数
  const updateExistingData = useCallback(async () => {
    try {
      const res = await fetch('/api/smoking', {
        method: 'PUT'
      });
      
      if (!res.ok) throw new Error('Failed to update existing data');
      
      const result = await res.json();
      console.log(result.message);
      
      // データを再取得
      await fetchData();
    } catch (error) {
      console.error('Error updating existing data:', error);
    }
  }, [fetchData]);

  const saveSmokingEvent = useCallback(async (timestamp: string) => {
    try {
      // 最新のタバコ設定のIDを取得
      const cigaretteId = cigaretteSettings?.id;
      
      const res = await fetch('/api/smoking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp,
          cigaretteId
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save event');
      
      // Refetch all data to ensure we have the latest
      await fetchData();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }, [fetchData, cigaretteSettings]);

  const saveCigaretteSettings = useCallback(async () => {
    if (!cigaretteSettings) return;
    
    try {
      const { ...settingsData } = cigaretteSettings;
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

  // Load data on component mount and update existing data
  useEffect(() => {
    fetchData().then(() => {
      updateExistingData();
    });
  }, [fetchData, updateExistingData]);

  // UI action handlers
  const handleSmokingButton = () => {
    saveSmokingEvent(new Date().toISOString());
    // 記録タブに自動的に切り替え
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, activeTab: 'record' }
    }));
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

  // タブ切り替え処理
  const handleTabChange = (tab: AppState['ui']['activeTab']) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, activeTab: tab }
    }));
  };

  // 健康改善情報の表示切り替え
  const toggleHealthBenefits = () => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, showHealthBenefits: !prev.ui.showHealthBenefits }
    }));
  };

  // UI状態の更新ハンドラー
  const handleManualTimestampChange = (value: string) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, manualTimestamp: value }
    }));
  };

  const handleBulkImportTextChange = (value: string) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, bulkImportText: value }
    }));
  };

  const handleGraphTypeChange = (value: AppState['ui']['selectedGraph']) => {
    setState(prev => ({
      ...prev, 
      ui: { 
        ...prev.ui, 
        selectedGraph: value,
        selectedDay: ''
      }
    }));
  };

  const handleSelectedDayChange = (value: string) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, selectedDay: value }
    }));
  };

  const handleBrandChange = (value: string) => {
    if (!cigaretteSettings) return;
    setState(prev => ({
      ...prev,
      cigaretteSettings: { ...prev.cigaretteSettings!, brand: value }
    }));
  };

  const handleTarChange = (value: number) => {
    if (!cigaretteSettings) return;
    setState(prev => ({
      ...prev,
      cigaretteSettings: { ...prev.cigaretteSettings!, tar: value }
    }));
  };

  const handleNicotineChange = (value: number) => {
    if (!cigaretteSettings) return;
    setState(prev => ({
      ...prev,
      cigaretteSettings: { ...prev.cigaretteSettings!, nicotine: value }
    }));
  };

  // 最後の喫煙からの経過時間を計算
  const lastSmokingTime = useMemo(() => {
    if (smokingEvents.length === 0) return null;
    return new Date(smokingEvents[0].timestamp);
  }, [smokingEvents]);

  const timeSinceLastSmoking = useMemo(() => {
    if (!lastSmokingTime) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastSmokingTime.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    return { hours, days, diffMs };
  }, [lastSmokingTime]);

  // チャートデータの準備
  const groups = useMemo(() => groupEventsByDay(smokingEvents), [smokingEvents]);
  const sortedDays = useMemo(() => Object.keys(groups).sort(), [groups]);
  const last30DaysData = useMemo(() => getLast30DaysData(groups), [groups]);

  // 最新の日付を選択
  useEffect(() => {
    if (ui.selectedGraph === 'time_of_day' && sortedDays.length > 0 && !ui.selectedDay) {
      setState(prev => ({
        ...prev,
        ui: { ...prev.ui, selectedDay: sortedDays[sortedDays.length - 1] }
      }));
    }
  }, [ui.selectedGraph, ui.selectedDay, sortedDays]);

  const chartData = useMemo(() => 
    getChartData(
      ui.selectedGraph, 
      ui.selectedDay, 
      smokingEvents, 
      groups, 
      sortedDays, 
      last30DaysData
    ), 
    [ui.selectedGraph, ui.selectedDay, smokingEvents, groups, sortedDays, last30DaysData]
  );

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* ヘッダー */}
      <Header onSmokingButtonClick={handleSmokingButton} />

      {/* 最後の喫煙からの経過時間と健康状態 */}
      <HealthStatus 
        lastSmokingTime={lastSmokingTime}
        timeSinceLastSmoking={timeSinceLastSmoking}
        showHealthBenefits={ui.showHealthBenefits}
        toggleHealthBenefits={toggleHealthBenefits}
      />

      {/* メインコンテンツ */}
      <main className="container mx-auto p-4">
        {/* タブナビゲーション */}
        <TabNavigation 
          activeTab={ui.activeTab} 
          onTabChange={handleTabChange} 
        />

        {/* 記録タブ */}
        {ui.activeTab === 'record' && (
          <RecordTab 
            smokingEvents={smokingEvents}
            manualTimestamp={ui.manualTimestamp}
            bulkImportText={ui.bulkImportText}
            cigaretteSettings={cigaretteSettings}
            onManualSubmit={handleManualSubmit}
            onBulkImport={handleBulkImport}
            onManualTimestampChange={handleManualTimestampChange}
            onBulkImportTextChange={handleBulkImportTextChange}
          />
        )}

        {/* 統計タブ */}
        {ui.activeTab === 'stats' && (
          <StatsTab 
            smokingEvents={smokingEvents}
            cigaretteSettings={cigaretteSettings}
            selectedGraph={ui.selectedGraph}
            selectedDay={ui.selectedDay}
            sortedDays={sortedDays}
            chartData={chartData}
            onGraphTypeChange={handleGraphTypeChange}
            onSelectedDayChange={handleSelectedDayChange}
          />
        )}

        {/* 設定タブ */}
        {ui.activeTab === 'settings' && cigaretteSettings && (
          <SettingsTab 
            cigaretteSettings={cigaretteSettings}
            onSettingsSubmit={handleSettingsSubmit}
            onBrandChange={handleBrandChange}
            onTarChange={handleTarChange}
            onNicotineChange={handleNicotineChange}
          />
        )}
      </main>
    </div>
  );
}
