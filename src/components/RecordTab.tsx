'use client';

import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SmokingEvent, CigaretteSettings } from '@/types';

type RecordTabProps = {
  smokingEvents: SmokingEvent[];
  manualTimestamp: string;
  bulkImportText: string;
  cigaretteSettings: CigaretteSettings | null;
  onManualSubmit: (e: React.FormEvent) => void;
  onBulkImport: (e: React.FormEvent) => void;
  onManualTimestampChange: (value: string) => void;
  onBulkImportTextChange: (value: string) => void;
};

const RecordTab: React.FC<RecordTabProps> = ({
  smokingEvents,
  manualTimestamp,
  bulkImportText,
  cigaretteSettings,
  onManualSubmit,
  onBulkImport,
  onManualTimestampChange,
  onBulkImportTextChange
}) => {
  return (
    <div className="space-y-6">
      {/* 手動入力フォーム */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">手動入力</h2>
          <form onSubmit={onManualSubmit} className="flex flex-col md:flex-row items-center gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">日時</span>
              </label>
              <input
                type="datetime-local"
                value={manualTimestamp}
                onChange={(e) => onManualTimestampChange(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-6"
            >
              保存
            </button>
          </form>
        </div>
      </div>

      {/* 一括入力フォーム */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">一括入力 (過去の記録のインポート)</h2>
          <form onSubmit={onBulkImport} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">データ形式: YYYY-MM-DD, 本数</span>
              </label>
              <textarea
                value={bulkImportText}
                onChange={(e) => onBulkImportTextChange(e.target.value)}
                placeholder="例: 2023-03-15, 5&#10;2023-03-16, 3"
                className="textarea textarea-bordered h-32"
              />
            </div>
            <button
              type="submit"
              className="btn btn-accent w-full md:w-auto"
            >
              インポート
            </button>
          </form>
        </div>
      </div>

      {/* データ表示 */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">記録一覧</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時間</th>
                  <th>銘柄</th>
                  <th>タール (mg)</th>
                  <th>ニコチン (mg)</th>
                </tr>
              </thead>
              <tbody>
                {smokingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">記録がありません</td>
                  </tr>
                ) : (
                  smokingEvents.map(event => {
                    const cigarette = event.cigarette || cigaretteSettings;
                    return (
                      <tr key={event.id}>
                        <td>{format(new Date(event.timestamp), 'yyyy年MM月dd日', { locale: ja })}</td>
                        <td>{format(new Date(event.timestamp), 'HH:mm:ss', { locale: ja })}</td>
                        <td>{cigarette?.brand || '不明'}</td>
                        <td>{cigarette?.tar || 0}</td>
                        <td>{cigarette?.nicotine || 0}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordTab;
