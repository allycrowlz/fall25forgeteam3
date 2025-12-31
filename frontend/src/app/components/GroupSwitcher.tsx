'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGroup } from '../contexts/GroupContext';
import { Building2, ChevronDown, Plus, LogIn } from 'lucide-react';

const BROWN = "#4C331D";

interface GroupSwitcherProps {
  variant?: 'default' | 'navbar';
  showActions?: boolean;
  theme?: 'light' | 'dark';
}

export default function GroupSwitcher({
  variant = 'default',
  showActions = true,
  theme = 'light',
}: GroupSwitcherProps) {
  const { currentGroup, allGroups, switchGroup } = useGroup();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Navbar variant shows join/create as separate buttons
  if (variant === 'navbar') {
    const isDarkTheme = theme === 'dark';
    const triggerClasses = isDarkTheme
      ? 'bg-[#4C331D] text-white border-transparent'
      : 'bg-white text-[#4C331D]';
    const dropdownBg = isDarkTheme ? '#4C331D' : '#FFFFFF';
    const dropdownText = isDarkTheme ? 'text-white' : 'text-[#4C331D]';
    const dropdownHover = isDarkTheme ? 'hover:bg-[#5c3f26]' : 'hover:bg-gray-100';
    const dropdownBorder = isDarkTheme ? 'border-[#805736]' : 'border-gray-300';

    if (!currentGroup) {
      if (showActions) {
        return (
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/groups/join')}
              className="px-6 py-1 bg-white rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              style={{ color: BROWN }}
            >
              + Add Group
            </button>
            <button
              onClick={() => router.push('/groups/create')}
              className="px-6 py-1 bg-white rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              style={{ color: BROWN }}
            >
              + Create Group
            </button>
          </div>
        );
      }

      return (
        <button
          onClick={() => router.push('/groups')}
          className="px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: '#4C331D', color: 'white' }}
        >
          Go to Groups
        </button>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-80 px-4 py-1 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all flex items-center justify-between border-2 ${triggerClasses}`}
          >
            <span className="flex-1 text-left truncate">{currentGroup.group_name}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              style={{ color: isDarkTheme ? '#FFFFFF' : BROWN }}
            />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div
                className={`absolute top-full left-0 mt-2 w-full rounded-xl shadow-lg z-20 overflow-hidden border-2 ${dropdownBorder}`}
                style={{ backgroundColor: dropdownBg }}
              >
                <div className="py-2">
                  {allGroups.map((group) => (
                    <button
                      key={group.group_id}
                      onClick={() => {
                        switchGroup(group.group_id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left transition-all flex items-center gap-2 ${dropdownHover} ${
                        group.group_id === currentGroup.group_id ? 'opacity-100 font-semibold' : ''
                      } ${dropdownText}`}
                    >
                      <span className="flex-1 truncate">{group.group_name}</span>
                      {group.group_id === currentGroup.group_id && (
                        <span className={isDarkTheme ? 'text-white' : 'text-green-600'}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {showActions && (
          <>
            <button
              onClick={() => router.push('/groups/join')}
              className="px-6 py-1 bg-white rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              style={{ color: BROWN }}
            >
              + Add Group
            </button>
            <button
              onClick={() => router.push('/groups/create')}
              className="px-6 py-1 bg-white rounded-xl font-semibold hover:bg-gray-200 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
              style={{ color: BROWN }}
            >
              + Create Group
            </button>
          </>
        )}
      </div>
    );
  }

  // Default variant (for use in pages)
  if (!currentGroup) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/groups/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </button>
        <button
          onClick={() => router.push('/groups/join')}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          <LogIn className="h-4 w-4" />
          Join Group
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all min-w-[200px]"
      >
        <Building2 className="h-5 w-5 text-gray-600" />
        <span className="flex-1 text-left font-semibold text-gray-900 truncate">
          {currentGroup.group_name}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="py-2">
              {allGroups.map((group) => (
                <button
                  key={group.group_id}
                  onClick={() => {
                    switchGroup(group.group_id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-all flex items-center gap-2 ${
                    group.group_id === currentGroup.group_id ? 'bg-gray-50 font-semibold' : ''
                  }`}
                >
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <span className="flex-1 truncate">{group.group_name}</span>
                  {group.group_id === currentGroup.group_id && (
                    <span className="text-green-600">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="border-t-2 border-gray-200 py-2">
              <button
                onClick={() => {
                  router.push('/groups/create');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-all flex items-center gap-2 text-gray-700"
              >
                <Plus className="h-4 w-4" />
                Create new group
              </button>
              <button
                onClick={() => {
                  router.push('/groups/join');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-all flex items-center gap-2 text-gray-700"
              >
                <LogIn className="h-4 w-4" />
                Join a group
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}