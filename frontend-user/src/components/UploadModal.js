import React, { useState } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { X, Upload, FileText, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UploadModal = ({ isOpen, onClose }) => {
  const { createDocument } = useDocuments();
  const [formData, setFormData] = useState({
    title: '',
    file: null,
    uploadAt: ''
  });
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file: file
    });
  };

  const isImageFile = (file) => {
    if (!file) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(file.type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) {
      return;
    }

    setLoading(true);
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('file', formData.file);
    if (formData.uploadAt) {
      uploadData.append('uploadAt', formData.uploadAt);
    }

    const result = await createDocument(uploadData);
    
    if (result.success) {
      setFormData({ title: '', file: null, uploadAt: '' });
      onClose();
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setFormData({ title: '', file: null, uploadAt: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-brand-600" />
            {t('uploadModal.title')}
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
                {t('uploadModal.fileTitle')}
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={t('uploadModal.fileTitlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('uploadModal.uploadDate')} (Optional)
              </label>
              <input
                type="date"
                className="input-field"
                value={formData.uploadAt}
                onChange={(e) => setFormData({ ...formData, uploadAt: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('uploadModal.uploadDateHelp')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('uploadModal.selectFile')}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {formData.file && isImageFile(formData.file) ? (
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                  ) : (
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500 "
                    >
                      <span>{t('uploadModal.upload')}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                      />
                    </label>

                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF, BMP, WEBP, SVG up to 10MB
                  </p>
                </div>
              </div>
              {formData.file && (
                <p className="mt-2 text-sm text-gray-600">
                  {t('uploadModal.selectedFile')}: {formData.file.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t('uploadModal.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.title || !formData.file}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('uploadModal.uploading')}
                </div>
              ) : (
                t('uploadModal.upload')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
