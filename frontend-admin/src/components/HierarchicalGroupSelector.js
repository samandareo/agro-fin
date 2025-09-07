import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

const HierarchicalGroupSelector = ({ value, onChange, disabled = false }) => {
  const [rootGroups, setRootGroups] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [subgroups, setSubgroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const loadRootGroups = async () => {
    setLoading(true);
    try {
      const response = await groupsAPI.getRootGroups();
      if (response.data.success) {
        setRootGroups(response.data.data || []);
      } else {
        toast.error('Failed to load root groups');
      }
    } catch (error) {
      toast.error('Failed to load root groups');
    } finally {
      setLoading(false);
    }
  };


  const loadSubgroups = async (parentId) => {
    if (subgroups[parentId]) return;

    try {
      const response = await groupsAPI.getSubgroups(parentId);
      if (response.data.success) {
        setSubgroups(prev => ({
          ...prev,
          [parentId]: response.data.data || []
        }));
      }
    } catch (error) {
      console.error('Failed to load subgroups:', error);
    }
  };

  const toggleGroup = async (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (expandedGroups.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
      await loadSubgroups(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const selectGroup = (group) => {
    setSelectedGroup(group);
    onChange(group.id);
  };

  const renderGroupItem = (group, level = 0) => {
    const isExpanded = expandedGroups.has(group.id);
    const hasSubgroups = subgroups[group.id] && subgroups[group.id].length > 0;
    const isSelected = selectedGroup && selectedGroup.id === group.id;

    return (
      <div key={group.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? 'bg-admin-100 text-admin-700' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => selectGroup(group)}
        >
          {/* Expand/Collapse Button */}
          <button
            className="mr-2 p-1 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation();
              toggleGroup(group.id);
            }}
            disabled={!hasSubgroups}
          >
            {hasSubgroups ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Group Icon */}
          <div className="mr-2">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-admin-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* Group Name */}
          <span className="text-sm font-medium">{group.name}</span>
        </div>

        {/* Subgroups */}
        {isExpanded && subgroups[group.id] && (
          <div>
            {subgroups[group.id].map(subgroup => 
              renderGroupItem(subgroup, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadRootGroups();
  }, []);

  if (loading) {
    return (
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-admin-600 mr-2"></div>
          <span className="text-sm text-gray-500">Loading groups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
      {rootGroups.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <Folder className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No groups found</p>
        </div>
      ) : (
        <div className="p-2">
          {rootGroups.map(group => renderGroupItem(group))}
        </div>
      )}
    </div>
  );
};

export default HierarchicalGroupSelector;

