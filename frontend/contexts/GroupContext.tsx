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
  const [isClient, setIsClient] = useState(false); // NEW: Track if we're on client

  // NEW: Set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user.profile_id) {
        const userGroups = await getUserGroups(parseInt(user.profile_id, 10));
        setGroups(userGroups);

        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
          // Restore previously selected group from localStorage
          const savedGroupId = localStorage.getItem('selectedGroupId');
          if (savedGroupId) {
            const savedGroup = userGroups.find(g => g.group_id === parseInt(savedGroupId));
            if (savedGroup) {
              setSelectedGroup(savedGroup);
              return; // Exit early if we found saved group
            }
          }
        }

        // Auto-select first group if none selected
        if (userGroups.length > 0) {
          setSelectedGroup(userGroups[0]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedGroupId', userGroups[0].group_id.toString());
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
    if (isClient) { // Only fetch on client side
      fetchGroups();
    }
  }, [isClient]);

  const updateSelectedGroup = (group: Group | null) => {
    setSelectedGroup(group);
    if (typeof window !== 'undefined') { // Only access localStorage on client
      if (group) {
        localStorage.setItem('selectedGroupId', group.group_id.toString());
      } else {
        localStorage.removeItem('selectedGroupId');
      }
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