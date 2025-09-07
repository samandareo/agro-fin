import React, { useState } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { Plus, FileText, Filter, Search } from 'lucide-react';
import SearchAndFilters from './SearchAndFilters';
import ReportsTable from './ReportsTable';
import UploadModal from './UploadModal';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { documents, loading } = useDocuments();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-brand-600" />
                {t('documents.title')}
              </h1>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t('documents.upload')}
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          <SearchAndFilters />
        </div>

        <div className="px-4 sm:px-0">
          <ReportsTable />
        </div>

      </div>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
};

export default Dashboard;
