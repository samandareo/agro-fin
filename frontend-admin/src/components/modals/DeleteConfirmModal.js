import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, item, onConfirm, isDeleting = false }) => {
  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    onConfirm(item);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            Confirm Deletion
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">
                Delete "{item.name}"?
              </h4>
              <p className="mt-2 text-sm text-gray-500">
                This action cannot be undone. This will permanently delete the group
                {item.children && item.children.length > 0 && (
                  <span className="block mt-1 text-red-600 font-medium">
                    and all its subgroups ({item.children.length} subgroups will also be deleted).
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn-danger flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

