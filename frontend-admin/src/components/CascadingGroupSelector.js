import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CascadingGroupSelector = ({ value, onChange, disabled = false }) => {
  const [rootGroups, setRootGroups] = useState([]);
  const [subGroups, setSubGroups] = useState([]);
  const [selectedRootGroup, setSelectedRootGroup] = useState(null);
  const [loadingRootGroups, setLoadingRootGroups] = useState(true);
  const [loadingSubGroups, setLoadingSubGroups] = useState(false);
  const [showSubGroups, setShowSubGroups] = useState(false);

  useEffect(() => {
    const fetchRootGroups = async () => {
      setLoadingRootGroups(true);
      try {
        const response = await groupsAPI.getRootGroups();
        if (response.data.success) {
          setRootGroups(response.data.data || []);
        } else {
          toast.error(response.data.message || 'Failed to load root groups');
        }
      } catch (error) {
        console.error('Error fetching root groups:', error);
        toast.error('Failed to load root groups');
      } finally {
        setLoadingRootGroups(false);
      }
    };

    fetchRootGroups();
  }, []);

  useEffect(() => {
    if (value && rootGroups.length > 0) {
      const rootGroup = rootGroups.find(g => g.id === value);
      if (rootGroup) {
        setSelectedRootGroup(rootGroup);
        setShowSubGroups(false);
        setSubGroups([]);
        return;
      }

      const findParentGroup = async () => {
        try {
          const response = await groupsAPI.getAll();
          if (response.data.success) {
            const allGroups = response.data.data || [];
            const selectedGroup = allGroups.find(g => g.id === value);
            if (selectedGroup && selectedGroup.parent_id) {
              let currentGroup = selectedGroup;
              while (currentGroup.parent_id) {
                currentGroup = allGroups.find(g => g.id === currentGroup.parent_id);
                if (!currentGroup) break;
              }
              
              if (currentGroup) {
                setSelectedRootGroup(currentGroup);
                const subResponse = await groupsAPI.getSubgroups(currentGroup.id);
                if (subResponse.data.success) {
                  setSubGroups(subResponse.data.data || []);
                  setShowSubGroups(true);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error finding parent group:', error);
        }
      };

      findParentGroup();
    }
  }, [value, rootGroups]);

  const handleRootGroupChange = async (rootGroupId) => {
    const rootGroup = rootGroups.find(g => g.id === parseInt(rootGroupId));
    setSelectedRootGroup(rootGroup);
    
    if (rootGroupId) {
      setLoadingSubGroups(true);
      try {
        const response = await groupsAPI.getSubgroups(rootGroupId);
        if (response.data.success) {
          const subgroups = response.data.data || [];
          setSubGroups(subgroups);
          setShowSubGroups(true);
          
          if (subgroups.length === 0) {
            onChange(parseInt(rootGroupId));
          } else {
            onChange(null);
          }
        } else {
          toast.error(response.data.message || 'Failed to load subgroups');
          setSubGroups([]);
          setShowSubGroups(false);
        }
      } catch (error) {
        console.error('Error fetching subgroups:', error);
        toast.error('Failed to load subgroups');
        setSubGroups([]);
        setShowSubGroups(false);
      } finally {
        setLoadingSubGroups(false);
      }
    } else {
      setSubGroups([]);
      setShowSubGroups(false);
      onChange(null);
    }
  };

  const handleSubGroupChange = (subGroupId) => {
    onChange(parseInt(subGroupId));
  };

  const getDisplayValue = () => {
    if (!value) return '';
    
    const rootGroup = rootGroups.find(g => g.id === value);
    if (rootGroup) return rootGroup.name;
    
    const subGroup = subGroups.find(g => g.id === value);
    if (subGroup) return `${selectedRootGroup?.name} → ${subGroup.name}`;
    
    return '';
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Root Group *
        </label>
        <select
          value={selectedRootGroup?.id || ''}
          onChange={(e) => handleRootGroupChange(e.target.value)}
          disabled={disabled || loadingRootGroups}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a root group</option>
          {rootGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        {loadingRootGroups && (
          <p className="text-xs text-gray-500 mt-1">Loading root groups...</p>
        )}
      </div>

      {showSubGroups && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub Group {subGroups.length > 0 ? '*' : ''}
          </label>
          {loadingSubGroups ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
              <p className="text-sm text-gray-500">Loading subgroups...</p>
            </div>
          ) : subGroups.length > 0 ? (
            <select
              value={value || ''}
              onChange={(e) => handleSubGroupChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a subgroup</option>
              {subGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-500">
                No subgroups available for this root group
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The root group will be selected automatically
              </p>
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {getDisplayValue()}
          </p>
        </div>
      )}
    </div>
  );
};

export default CascadingGroupSelector;
