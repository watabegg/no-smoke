export type SmokingEvent = {
  id: string;
  timestamp: string;
  cigaretteId?: string;
  cigarette?: CigaretteSettings;
};

export type CigaretteSettings = {
  id: string;
  brand: string;
  tar: number;
  nicotine: number;
};

export type AppState = {
  smokingEvents: SmokingEvent[];
  cigaretteSettings: CigaretteSettings | null;
  ui: {
    manualTimestamp: string;
    bulkImportText: string;
    selectedGraph: 'daily_count' | 'daily_nicotine' | 'daily_tar' | 'time_of_day' | 'trend';
    selectedDay: string;
    activeTab: 'record' | 'stats' | 'settings';
    showHealthBenefits: boolean;
  };
};

// 禁煙後の健康改善タイムライン
export const healthBenefits = [
  { hours: 1, benefit: "心拍数と血圧が正常に戻り始めます" },
  { hours: 12, benefit: "血液中の一酸化炭素レベルが正常値に戻ります" },
  { hours: 24, benefit: "心臓発作のリスクが減少し始めます" },
  { hours: 48, benefit: "味覚と嗅覚が改善し始めます" },
  { hours: 72, benefit: "気管支が緩み、呼吸が楽になります" },
  { days: 14, benefit: "肺機能が向上し、循環が改善します" },
  { days: 30, benefit: "咳や息切れが減少します" },
  { days: 90, benefit: "肺の自浄作用が回復します" },
  { days: 365, benefit: "冠状動脈疾患のリスクが半減します" },
];
