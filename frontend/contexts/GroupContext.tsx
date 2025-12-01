// contexts/GroupContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserGroups, type Group } from '@/app/services/groupService';
import { getCurrentUser } from '@/app/services/authService';

interface GroupContextType {
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  groups: Group[];
  loading: boolean;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user.profile_id) {
        const userGroups = await getUserGroups(parseInt(user.profile_id, 10));
        setGroups(userGroups);
        
        // Auto-select first group if none selected
        if (userGroups.length > 0 && !selectedGroup) {
          setSelectedGroup(userGroups[0]);
          localStorage.setItem('selectedGroupId', userGroups[0].group_id.toString());
        }
        
        // Restore previously selected group from localStorage
        const savedGroupId = localStorage.getItem('selectedGroupId');
        if (savedGroupId) {
          const savedGroup = userGroups.find(g => g.group_id === parseInt(savedGroupId));
          if (savedGroup) {
            setSelectedGroup(savedGroup);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const updateSelectedGroup = (group: Group | null) => {
    setSelectedGroup(group);
    if (group) {
      localStorage.setItem('selectedGroupId', group.group_id.toString());
    } else {
      localStorage.removeItem('selectedGroupId');
    }
  };

  return (
    <GroupContext.Provider 
      value={{ 
        selectedGroup, 
        setSelectedGroup: updateSelectedGroup, 
        groups, 
        loading,
        refreshGroups: fetchGroups 
      }}
    >
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