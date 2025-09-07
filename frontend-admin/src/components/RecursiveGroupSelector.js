import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

const GroupItem = ({ group, level, selectedGroupId, onSelect, disabled, expandedGroups, onToggleExpand, children }) => {
  const isExpanded = expandedGroups.has(group.id);
  const hasChildren = children && children.length > 0;
  const isSelected = selectedGroupId === group.id;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(group.id);
    } else {
      onSelect(group.id);
    }
  };

  const handleSelect = () => {
    onSelect(group.id);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-blue-100 text-blue-800' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
          )
        ) : (
          <div className="w-5 h-4 mr-1" />
        )}
        
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
          )
        ) : (
          <Folder className="h-4 w-4 mr-2 text-gray-400" />
        )}
        
        <span className="text-sm">{group.name}</span>
        
        {isSelected && (
          <span className="ml-auto text-xs text-blue-600 font-medium">Selected</span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <GroupItem
              key={child.id}
              group={child}
              level={level + 1}
              selectedGroupId={selectedGroupId}
              onSelect={onSelect}
              disabled={disabled}
              expandedGroups={expandedGroups}
              onToggleExpand={onToggleExpand}
              children={child.children}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RecursiveGroupSelector = ({ value, onChange, disabled = false }) => {
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchAllGroups = async () => {
    setLoading(true);
    try {
      const groups = await fetchGroupsRecursively(0);
      setAllGroups(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupsRecursively = async (parentId) => {
    try {
      const response = await groupsAPI.getSubgroups(parentId);
      
      if (!response.data.success) {
        console.warn(`Failed to fetch groups for parent ${parentId}:`, response.data.message);
        return [];
      }

      const groups = response.data.data || [];
      
      if (groups.length === 0) {
        return [];
      }

      const groupsWithChildren = await Promise.all(
        groups.map(async (group) => {
          const children = await fetchGroupsRecursively(group.id);
          return {
            ...group,
            children: children
          };
        })
      );

      return groupsWithChildren;
    } catch (error) {
      console.error(`Error fetching groups for parent ${parentId}:`, error);
      return [];
    }
  };

  useEffect(() => {
    fetchAllGroups();
  }, []);

  useEffect(() => {
    if (value && allGroups.length > 0) {
      const findGroupById = (groups, targetId) => {
        for (const group of groups) {
          if (group.id === targetId) {
            return group;
          }
          if (group.children) {
            const found = findGroupById(group.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedGroup = findGroupById(allGroups, value);
      if (selectedGroup) {
        setSelectedGroup(selectedGroup);
        expandToShowGroup(selectedGroup.id);
      }
    }
  }, [value, allGroups]);

  const expandToShowGroup = (groupId) => {
    const findPathToGroup = (groups, targetId, path = []) => {
      for (const group of groups) {
        const currentPath = [...path, group.id];
        if (group.id === targetId) {
          return currentPath;
        }
        if (group.children) {
          const found = findPathToGroup(group.children, targetId, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findPathToGroup(allGroups, groupId);
    if (path) {
      const newExpandedGroups = new Set(expandedGroups);
      path.slice(0, -1).forEach(id => newExpandedGroups.add(id));
      setExpandedGroups(newExpandedGroups);
    }
  };

  const handleGroupSelect = (groupId) => {
    onChange(groupId);
    
    const findGroupById = (groups, targetId) => {
      for (const group of groups) {
        if (group.id === targetId) {
          return group;
        }
        if (group.children) {
          const found = findGroupById(group.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const group = findGroupById(allGroups, groupId);
    setSelectedGroup(group);
  };

  const handleToggleExpand = (groupId) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupId)) {
      newExpandedGroups.delete(groupId);
    } else {
      newExpandedGroups.add(groupId);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const getDisplayValue = () => {
    if (!selectedGroup) return '';
    
    const getGroupPath = (group, groups, path = []) => {
      for (const g of groups) {
        const currentPath = [...path, g.name];
        if (g.id === group.id) {
          return currentPath.join(' → ');
        }
        if (g.children) {
          const found = getGroupPath(group, g.children, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    return getGroupPath(selectedGroup, allGroups) || selectedGroup.name;
  };

  if (loading) {
    return (
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <p className="text-sm text-gray-500">Loading groups...</p>
      </div>
    );
  }

  if (allGroups.length === 0) {
    return (
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <p className="text-sm text-gray-500">No groups available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group *
        </label>
        {/* Group Tree */}
        <div className="border border-gray-300 rounded-md p-2 bg-white max-h-48 overflow-y-auto">
        {allGroups.map(group => (
          <GroupItem
            key={group.id}
            group={group}
            level={0}
            selectedGroupId={value}
            onSelect={handleGroupSelect}
            disabled={disabled}
            expandedGroups={expandedGroups}
            onToggleExpand={handleToggleExpand}
            children={group.children}
          />
        ))}
        </div>
      </div>

      {/* Selected Group Display */}
      {value && selectedGroup && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {getDisplayValue()}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecursiveGroupSelector;
