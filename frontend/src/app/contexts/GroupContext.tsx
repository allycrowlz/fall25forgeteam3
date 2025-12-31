'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getUserGroups, type Group } from '../services/groupService';
import { getCurrentUser, isAuthenticated } from '../services/authService';

interface GroupContextType {
  currentGroup: Group | null;
  allGroups: Group[];
  switchGroup: (groupId: number) => void;
  refreshGroups: () => Promise<void>;
  loading: boolean;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      // Only load groups if user is authenticated
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user.profile_id) {
        setLoading(false);
        return;
      }

      const groups = await getUserGroups(parseInt(user.profile_id, 10));
      setAllGroups(groups);

      // Load saved group preference or use first group
      const savedGroupId = localStorage.getItem('currentGroupId');
      if (savedGroupId) {
        const savedGroup = groups.find(g => g.group_id === parseInt(savedGroupId));
        if (savedGroup) {
          setCurrentGroup(savedGroup);
        } else if (groups.length > 0) {
          setCurrentGroup(groups[0]);
          localStorage.setItem('currentGroupId', groups[0].group_id.toString());
        }
      } else if (groups.length > 0) {
        setCurrentGroup(groups[0]);
        localStorage.setItem('currentGroupId', groups[0].group_id.toString());
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Don't load groups on public pages
    const publicPages = ['/', '/login', '/signup'];
    if (publicPages.includes(pathname)) {
      setLoading(false);
      return;
    }

    loadGroups();
  }, [pathname]);

  const switchGroup = (groupId: number) => {
    const group = allGroups.find(g => g.group_id === groupId);
    if (group) {
      setCurrentGroup(group);
      localStorage.setItem('currentGroupId', groupId.toString());
    }
  };

  const refreshGroups = async () => {
    await loadGroups();
  };

  return (
    <GroupContext.Provider value={{ currentGroup, allGroups, switchGroup, refreshGroups, loading }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}