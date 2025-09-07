import React, { useState, useEffect } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { X, Edit, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EditModal = ({ isOpen, onClose, document }) => {
  const { updateDocument } = useDocuments();
  const [formData, setFormData] = useState({
    title: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('edit');

  const { t } = useTranslation();

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        file: null
      });
    }
  }, [document]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file: file
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      return;
    }

    setLoading(true);
    const updateData = new FormData();
    updateData.append('title', formData.title);
    
    if (formData.file) {
      updateData.append('file', formData.file);
    }

    const result = await updateDocument(document.id, updateData);
    
    if (result.success) {
      setFormData({ title: '', file: null });
      onClose();
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setFormData({ title: '', file: null });
    setMode('edit');
    onClose();
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit className="h-5 w-5 mr-2 text-brand-600" />
            {mode === 'edit' ? t('editModal.edit') : t('editModal.replace')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('editModal.fileTitle')}
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={t('editModal.fileTitlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {mode === 'replace' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('editModal.selectNewFile')}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500"
                      >
                        <span>{t('editModal.upload')}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT up to 10MB
                    </p>
                  </div>
                </div>
                {formData.file && (
                  <p className="mt-2 text-sm text-gray-600">
                    {t('editModal.selectedFile')}: {formData.file.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'edit'
                    ? 'bg-brand-100 text-brand-700 border border-brand-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {t('editModal.editNameOnly')}
              </button>
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'replace'
                    ? 'bg-brand-100 text-brand-700 border border-brand-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {t('editModal.replace')}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t('editModal.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.title || (mode === 'replace' && !formData.file)}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? t('editModal.updating') : t('editModal.replacing')}
                </div>
              ) : (
                mode === 'edit' ? t('editModal.edit') : t('editModal.replace')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
