import React, { useState, useEffect } from 'react';
import { groupsAPI } from '../services/api';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

const RecursiveGroupSelector = ({ 
  value, 
  onChange, 
  disabled = false, 
  isMultiple = false,
  selectedGroups = []
}) => {
  const [groups, setGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [allGroupsMap, setAllGroupsMap] = useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      if (response.data.success) {
        const allGroups = response.data.data;
        
        // Create a map of all groups by ID for quick lookup
        const groupMap = {};
        allGroups.forEach(group => {
          groupMap[group.id] = { ...group, children: [] };
        });
        
        setAllGroupsMap(groupMap);
        
        // Build tree structure
        const rootGroups = [];
        allGroups.forEach(group => {
          if (!group.parent_id) {
            // Root group
            rootGroups.push(groupMap[group.id]);
          } else if (groupMap[group.parent_id]) {
            // Add to parent's children
            groupMap[group.parent_id].children.push(groupMap[group.id]);
          }
        });
        
        // Sort children by name
        const sortChildren = (groups) => {
          groups.forEach(group => {
            if (group.children && group.children.length > 0) {
              group.children.sort((a, b) => a.name.localeCompare(b.name));
              sortChildren(group.children);
            }
          });
        };
        
        rootGroups.sort((a, b) => a.name.localeCompare(b.name));
        sortChildren(rootGroups);
        
        setGroups(rootGroups);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleGroupClick = (groupId) => {
    if (isMultiple) {
      onChange(groupId); // Toggle on/off
    } else {
      onChange(groupId);
    }
  };

  const isGroupSelected = (groupId) => {
    if (isMultiple) {
      return Array.isArray(selectedGroups) && selectedGroups.includes(groupId);
    }
    return value === groupId;
  };

  const renderGroup = (group) => {
    const isSelected = isGroupSelected(group.id);
    const isExpanded = expandedGroups.has(group.id);
    const hasChildren = group.children && group.children.length > 0;

    return (
      <div key={group.id} className="my-1">
        <div className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-100 transition">
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(group.id)}
              className="p-0 hover:bg-gray-200 rounded flex-shrink-0"
              disabled={disabled}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Checkbox or Radio */}
          <div
            onClick={() => !disabled && handleGroupClick(group.id)}
            className={`flex items-center cursor-pointer flex-1 gap-2 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div
              className={`h-5 w-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${
                isSelected
                  ? 'bg-brand-600 border-brand-600'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && (
                <Check className="h-3 w-3 text-white" />
              )}
            </div>
            <span className={`text-sm font-medium truncate ${isSelected ? 'text-brand-600' : 'text-gray-700'}`}>
              {group.name}
            </span>
          </div>
        </div>

        {/* Sub-groups */}
        {hasChildren && isExpanded && (
          <div className="ml-4 pl-2 border-l border-gray-200">
            {group.children.map(subGroup => renderGroup(subGroup))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading groups...</div>;
  }

  if (groups.length === 0) {
    return <div className="text-sm text-gray-500">No groups available</div>;
  }

  return (
    <div className="space-y-1">
      {groups.map(group => renderGroup(group))}
    </div>
  );
};

export default RecursiveGroupSelector;
