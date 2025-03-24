'use client';

import React from 'react';
import { healthBenefits } from '@/types';

type HealthStatusProps = {
  lastSmokingTime: Date | null;
  timeSinceLastSmoking: { hours: number; days: number; diffMs: number } | null;
  showHealthBenefits: boolean;
  toggleHealthBenefits: () => void;
};

const HealthStatus: React.FC<HealthStatusProps> = ({
  lastSmokingTime,
  timeSinceLastSmoking,
  showHealthBenefits,
  toggleHealthBenefits
}) => {
  if (!lastSmokingTime) return null;

  // 現在の健康改善状況を取得
  const getCurrentHealthBenefit = () => {
    if (!timeSinceLastSmoking) return null;
    
    // 時間ベースの改善から探す
    for (let i = healthBenefits.length - 1; i >= 0; i--) {
      const benefit = healthBenefits[i];
      if (benefit.hours && timeSinceLastSmoking.hours >= benefit.hours) {
        return benefit;
      }
      if (benefit.days && timeSinceLastSmoking.days >= benefit.days) {
        return benefit;
      }
    }
    
    return { hours: 0, benefit: "まだ禁煙を始めたばかりです。頑張りましょう！" };
  };

  // 次の健康改善目標を取得
  const getNextHealthBenefit = () => {
    if (!timeSinceLastSmoking) return null;
    
    for (const benefit of healthBenefits) {
      const targetHours = benefit.hours || (benefit.days || 0) * 24;
      if (timeSinceLastSmoking.hours < targetHours) {
        return {
          ...benefit,
          hoursRemaining: targetHours - timeSinceLastSmoking.hours
        };
      }
    }
    
    return null; // すべての改善を達成済み
  };

  const currentHealthBenefit = getCurrentHealthBenefit();
  const nextHealthBenefit = getNextHealthBenefit();

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 mb-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-base-100 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-bold mb-2">最後の喫煙から</h2>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">経過日数</div>
                <div className="stat-value">{timeSinceLastSmoking?.days || 0}</div>
                <div className="stat-desc">日</div>
              </div>
              <div className="stat">
                <div className="stat-title">経過時間</div>
                <div className="stat-value">{(timeSinceLastSmoking?.hours || 0) % 24 || 0}</div>
                <div className="stat-desc">時間</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <button 
              onClick={toggleHealthBenefits}
              className="btn btn-outline btn-info mb-2 w-full"
            >
              {showHealthBenefits ? '健康情報を隠す' : '健康改善情報を表示'}
            </button>
            
            {showHealthBenefits && currentHealthBenefit && (
              <div className="bg-success/10 p-4 rounded-lg">
                <h3 className="font-bold text-success">現在の健康状態:</h3>
                <p className="mt-2">{currentHealthBenefit.benefit}</p>
                
                {nextHealthBenefit && (
                  <div className="mt-4">
                    <h3 className="font-bold text-info">次の目標:</h3>
                    <p className="mt-2">{nextHealthBenefit.benefit}</p>
                    <p className="text-sm mt-1">
                      あと{nextHealthBenefit.hoursRemaining}時間で達成できます！
                    </p>
                    <progress 
                      className="progress progress-info w-full mt-2" 
                      value={timeSinceLastSmoking?.hours || 0} 
                      max={nextHealthBenefit.hours || (nextHealthBenefit.days || 1) * 24}
                    ></progress>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthStatus;
