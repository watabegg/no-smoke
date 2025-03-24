'use client';

import React from 'react';
import { AppState } from '@/types';

type TabNavigationProps = {
  activeTab: AppState['ui']['activeTab'];
  onTabChange: (tab: AppState['ui']['activeTab']) => void;
};

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tabs tabs-boxed mb-6 flex justify-center">
      <button 
        className={`tab tab-lg flex-1 ${activeTab === 'record' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('record')}
      >
        記録
      </button>
      <button 
        className={`tab tab-lg flex-1 ${activeTab === 'stats' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('stats')}
      >
        統計
      </button>
      <button 
        className={`tab tab-lg flex-1 ${activeTab === 'settings' ? 'tab-active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        設定
      </button>
    </div>
  );
};

export default TabNavigation;
