import React from 'react';
import { LayoutGrid, Download, Settings, PlusCircle } from 'lucide-react';
import GodotLogo from './GodotLogo';

export default function Sidebar({ currentTab, setCurrentTab, installedCount, onImportCustom }) {
  const menuItems = [
    { id: 'installed', label: 'Installed', icon: LayoutGrid, count: installedCount },
    { id: 'releases', label: 'Available Releases', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-godot-sidebar border-r border-godot-border flex flex-col h-screen select-none shrink-0">
      {/* App Header with 3 Cascading Godot Mascot Logos */}
      <div className="p-4 flex items-center space-x-3 border-b border-godot-border">
        <GodotLogo className="w-12 h-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-base text-white leading-tight">
            Godot<br />
            <span className="text-gray-300 font-semibold text-sm">Version Manager</span>
          </h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-godot-blue text-white shadow-md shadow-godot-blue/20'
                  : 'text-gray-300 hover:bg-godot-card hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-godot-card text-gray-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action: Import Existing */}
      <div className="p-4 border-t border-godot-border">
        <button
          onClick={onImportCustom}
          className="w-full flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-godot-card hover:bg-godot-border text-gray-200 hover:text-white transition-colors border border-godot-border"
        >
          <PlusCircle className="w-4 h-4 text-godot-blue" />
          <span>Import Custom Binary</span>
        </button>
      </div>
    </aside>
  );
}
