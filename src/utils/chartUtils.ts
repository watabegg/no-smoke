import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SmokingEvent } from '@/types';

// 日付ごとに喫煙イベントをグループ化
export const groupEventsByDay = (smokingEvents: SmokingEvent[]) => {
  const groups: { [day: string]: SmokingEvent[] } = {};
  smokingEvents.forEach((event) => {
    const jstDate = new Date(event.timestamp);
    jstDate.setHours(jstDate.getHours() + 9); // JST調整を9時間に修正
    const dayStr = jstDate.toISOString().split('T')[0];
    if (!groups[dayStr]) {
      groups[dayStr] = [];
    }
    groups[dayStr].push(event);
  });
  return groups;
};

// 過去30日間のデータを取得（トレンド分析用）
export const getLast30DaysData = (groups: { [day: string]: SmokingEvent[] }) => {
  const today = new Date();
  const result: { date: string; count: number }[] = [];
  
  // 30日分の日付を生成
  for (let i = 29; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: groups[dateStr]?.length || 0
    });
  }
  
  return result;
};

// チャートデータの準備
export const getChartData = (
  selectedGraph: 'daily_count' | 'daily_nicotine' | 'daily_tar' | 'time_of_day' | 'trend',
  selectedDay: string,
  smokingEvents: SmokingEvent[],
  groups: { [day: string]: SmokingEvent[] },
  sortedDays: string[],
  last30DaysData: { date: string; count: number }[]
) => {
  if (selectedGraph === 'trend') {
    // トレンドグラフ（過去30日間の推移）
    return {
      labels: last30DaysData.map(d => d.date),
      datasets: [
        {
          label: '本数',
          data: last30DaysData.map(d => d.count),
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          tension: 0,
          spanGaps: true, // 欠損値をスキップ
          fill: true,
          pointRadius: last30DaysData.map(d => d.count === 0 ? 0 : 3),
          pointHoverRadius: last30DaysData.map(d => d.count === 0 ? 0 : 5),
          pointHitRadius: 10,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
        },
      ],
    };
  } else if (selectedGraph === 'time_of_day' && selectedDay && groups[selectedDay]) {
    // Time of day chart
    const bins = new Array(24).fill(0);
    const selectedDayStart = new Date(selectedDay + 'T00:00:00+09:00');
    const nextDayStart = new Date(selectedDayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);
    
    const targetEvents = smokingEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      const jstEventDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000);
      return jstEventDate >= selectedDayStart && jstEventDate < nextDayStart;
    });

    targetEvents.forEach((event) => {
      const eventDate = new Date(event.timestamp);
      const jstEventDate = new Date(eventDate.getTime() + 9 * 60 * 60 * 1000);
      const hour = jstEventDate.getHours();
      bins[hour]++;
    });
    
    const labels = Array.from({ length: 24 }, (_, i) => `${i}時`);
    
    return {
      labels,
      datasets: [
        {
          label: '本数',
          data: bins,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  } else {
    // Daily aggregated charts
    let data;
    switch (selectedGraph) {
      case 'daily_nicotine':
        data = {
          label: 'ニコチン (mg)',
          data: sortedDays.map((day) => {
            let totalNicotine = 0;
            groups[day].forEach(event => {
              const cigarette = event.cigarette;
              if (cigarette) {
                totalNicotine += cigarette.nicotine || 0;
              }
            });
            return totalNicotine;
          }),
          backgroundColor: 'rgba(153,102,255,0.6)',
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1,
        };
        break;
      case 'daily_tar':
        data = {
          label: 'タール (mg)',
          data: sortedDays.map((day) => {
            let totalTar = 0;
            groups[day].forEach(event => {
              const cigarette = event.cigarette;
              if (cigarette) {
                totalTar += cigarette.tar || 0;
              }
            });
            return totalTar;
          }),
          backgroundColor: 'rgba(255,159,64,0.6)',
          borderColor: 'rgba(255,159,64,1)',
          borderWidth: 1,
        };
        break;
      default: // daily_count
        data = {
          label: '本数',
          data: sortedDays.map((day) => groups[day].length),
          backgroundColor: 'rgba(75,192,192,0.6)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
        };
    }
    
    return {
      labels: sortedDays.map(day => {
        const date = new Date(day);
        return format(date, 'MM/dd', { locale: ja });
      }),
      datasets: [data],
    };
  }
};
