'use client';

import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SmokingEvent, CigaretteSettings, AppState } from '@/types';
import { ChartDataset } from 'chart.js';

// 型安全なチャートデータ型を定義
type SafeChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    tension?: number;
    fill?: boolean;
    radius?: number;
    hoverRadius?: number;
  }[];
};

interface StatsTabProps {
  smokingEvents: SmokingEvent[];
  cigaretteSettings: CigaretteSettings | null;
  selectedGraph: AppState['ui']['selectedGraph'];
  selectedDay: string;
  sortedDays: string[];
  chartData: SafeChartData;
  onGraphTypeChange: (value: AppState['ui']['selectedGraph']) => void;
  onSelectedDayChange: (value: string) => void;
}

const StatsTab: React.FC<StatsTabProps> = ({
  smokingEvents,
  cigaretteSettings,
  selectedGraph,
  selectedDay,
  sortedDays,
  chartData,
  onGraphTypeChange,
  onSelectedDayChange
}) => {
  // 総タール・ニコチン摂取量の計算
  const calculateTotalConsumption = () => {
    let totalTar = 0;
    let totalNicotine = 0;
    
    smokingEvents.forEach(event => {
      const cigarette = event.cigarette || cigaretteSettings;
      if (cigarette) {
        totalTar += cigarette.tar || 0;
        totalNicotine += cigarette.nicotine || 0;
      }
    });
    
    return { totalTar, totalNicotine };
  };
  
  const { totalTar, totalNicotine } = calculateTotalConsumption();

  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">グラフ表示</h2>
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">グラフタイプ</span>
            </label>
            <select
              value={selectedGraph}
              onChange={(e) => onGraphTypeChange(e.target.value as AppState['ui']['selectedGraph'])}
              className="select select-bordered w-full"
            >
              <option value="daily_count">日別本数</option>
              <option value="daily_nicotine">日別ニコチン</option>
              <option value="daily_tar">日別タール</option>
              <option value="time_of_day">時間別本数 (一日)</option>
              <option value="trend">トレンド (30日間)</option>
            </select>
          </div>

          {selectedGraph === 'time_of_day' && (
            <div className="form-control w-full max-w-xs mb-4">
              <label className="label">
                <span className="label-text">日付選択</span>
              </label>
              <select
                value={selectedDay}
                onChange={(e) => onSelectedDayChange(e.target.value)}
                className="select select-bordered w-full"
              >
                {sortedDays.length === 0 ? (
                  <option disabled>データがありません</option>
                ) : (
                  sortedDays.map(day => (
                    <option key={day} value={day}>
                      {format(new Date(day), 'yyyy年MM月dd日', { locale: ja })}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="bg-base-100 p-4 rounded-lg shadow w-full" style={{ height: '400px' }}>
            {selectedGraph === 'trend' ? (
              <Line
                data={{
                  labels: chartData.labels,
                  datasets: chartData.datasets as ChartDataset<'line', number[]>[]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { 
                      display: true, 
                      text: '過去30日間のトレンド',
                      font: { size: 16 }
                    },
                    tooltip: {
                      callbacks: {
                        title: (items) => format(new Date(items[0].label), 'yyyy年MM月dd日', { locale: ja }),
                        label: (item) => `${item.dataset.label}: ${item.formattedValue}本`
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        callback: (value, index) => {
                          // 5日ごとに日付を表示
                          return index % 5 === 0 ? format(new Date(chartData.labels[index]), 'MM/dd', { locale: ja }) : '';
                        }
                      },
                      title: {
                        display: true,
                        text: '日付'
                      }
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: '本数'
                      }
                    }
                  },
                  elements: {
                    line: {
                      tension: 0.4 // 曲線の滑らかさ
                    },
                    point: {
                      radius: 3,
                      hoverRadius: 5
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: chartData.labels,
                  datasets: chartData.datasets as ChartDataset<'bar', number[]>[]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { 
                      display: true, 
                      text: selectedGraph === 'time_of_day' 
                        ? `時間別本数 (${selectedDay ? format(new Date(selectedDay), 'yyyy年MM月dd日', { locale: ja }) : ''})` 
                        : selectedGraph === 'daily_nicotine'
                          ? 'ニコチン摂取量 (日別)'
                          : selectedGraph === 'daily_tar'
                            ? 'タール摂取量 (日別)'
                            : '喫煙本数 (日別)',
                      font: { size: 16 }
                    },
                    tooltip: {
                      callbacks: {
                        title: (items) => {
                          if (selectedGraph === 'time_of_day') {
                            return `${items[0].label}`;
                          }
                          return format(new Date(items[0].label), 'yyyy年MM月dd日', { locale: ja });
                        },
                        label: (item) => {
                          const value = item.formattedValue;
                          if (selectedGraph === 'daily_nicotine') {
                            return `ニコチン: ${value} mg`;
                          } else if (selectedGraph === 'daily_tar') {
                            return `タール: ${value} mg`;
                          }
                          return `本数: ${value}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: selectedGraph === 'time_of_day' ? 0 : 45,
                        minRotation: selectedGraph === 'time_of_day' ? 0 : 45,
                        font: { size: 10 }
                      },
                      title: {
                        display: true,
                        text: selectedGraph === 'time_of_day' ? '時間' : '日付'
                      }
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: selectedGraph === 'daily_nicotine' 
                          ? 'ニコチン (mg)' 
                          : selectedGraph === 'daily_tar' 
                            ? 'タール (mg)' 
                            : '本数'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">統計サマリー</h2>
          <div className="stats stats-vertical md:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-title">総本数</div>
              <div className="stat-value">{smokingEvents.length}</div>
              <div className="stat-desc">記録された喫煙回数</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">総タール摂取量</div>
              <div className="stat-value">{totalTar.toFixed(1)}</div>
              <div className="stat-desc">mg</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">総ニコチン摂取量</div>
              <div className="stat-value">{totalNicotine.toFixed(1)}</div>
              <div className="stat-desc">mg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
