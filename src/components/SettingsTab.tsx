'use client';

import React from 'react';
import { CigaretteSettings } from '@/types';

type SettingsTabProps = {
  cigaretteSettings: CigaretteSettings | null;
  onSettingsSubmit: (e: React.FormEvent) => void;
  onBrandChange: (value: string) => void;
  onTarChange: (value: number) => void;
  onNicotineChange: (value: number) => void;
};

const SettingsTab: React.FC<SettingsTabProps> = ({
  cigaretteSettings,
  onSettingsSubmit,
  onBrandChange,
  onTarChange,
  onNicotineChange
}) => {
  return (
    <div className="space-y-6">
      {/* タバコ設定フォーム */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">タバコの設定</h2>
          <form onSubmit={onSettingsSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">銘柄</span>
              </label>
              <input
                type="text"
                value={cigaretteSettings?.brand || ''}
                onChange={(e) => onBrandChange(e.target.value)}
                className="input input-bordered w-full"
                placeholder="例: マルボロ"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">タール (mg)</span>
              </label>
              <input
                type="number"
                value={cigaretteSettings?.tar || 0}
                onChange={(e) => onTarChange(Number(e.target.value))}
                className="input input-bordered w-full"
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">ニコチン (mg)</span>
              </label>
              <input
                type="number"
                value={cigaretteSettings?.nicotine || 0}
                onChange={(e) => onNicotineChange(Number(e.target.value))}
                className="input input-bordered w-full"
                step="0.1"
                min="0"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled
            >
              保存
            </button>
          </form>
        </div>
      </div>

      {/* アプリ情報 */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">アプリ情報</h2>
          <p>このアプリは禁煙・減煙を支援するために作られました。</p>
          <p>喫煙記録を付けることで、自分の喫煙習慣を把握し、徐々に減らしていくことができます。</p>
          <p>また、禁煙を始めた場合は、健康改善の進捗を確認することができます。</p>
          
          <div className="mt-4">
            <h3 className="font-bold">使い方</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>「喫煙記録」ボタンを押すと、現在時刻で喫煙記録が保存されます</li>
              <li>「記録」タブでは、手動での記録入力や過去データの一括インポートができます</li>
              <li>「統計」タブでは、様々なグラフで喫煙データを分析できます</li>
              <li>「設定」タブで、喫煙しているタバコの銘柄やタール・ニコチン量を設定できます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
