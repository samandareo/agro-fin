import React, { useState } from 'react';
import { useDocuments } from '../contexts/DocumentContext';
import { Search, Filter, X, Calendar, FileText } from 'lucide-react';
import DateInput from './DateInput';
import { useTranslation } from 'react-i18next';

const SearchAndFilters = () => {
  const { filters, filterOptions, applyFilters, clearFilters } = useDocuments();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const { t } = useTranslation();

  const handleFilterChange = (key, value) => {
    setLocalFilters({
      ...localFilters,
      [key]: value
    });
  };

  const handleApplyFilters = () => {
    applyFilters(localFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      title: '',
      year: '',
      month: '',
      date: '',
      startDate: '',
      endDate: '',
      groupId: '',
      page: 1,
      limit: 10
    });
    clearFilters();
    setShowFilters(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({ ...localFilters, page: 1 });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchAndFilters.searchPlaceholder')}
              className="input-field pl-10"
              value={localFilters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('searchAndFilters.filter')}
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {t('searchAndFilters.search')}
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchAndFilters.year')}
              </label>
              <select
                className="input-field"
                value={localFilters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">{t('searchAndFilters.allYears')}</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchAndFilters.month')}
              </label>
              <select
                className="input-field"
                value={localFilters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">{t('searchAndFilters.allMonths')}</option>
                {filterOptions.months.map(month => (
                  <option key={month} value={month}>
                    {t('months.' + new Date(2024, month - 1).toLocaleString('default', { month: 'long' }))}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchAndFilters.startDate')}
              </label>
              <DateInput
                value={localFilters.startDate}
                onChange={(value) => handleFilterChange('startDate', value)}
                placeholder="DD/MM/YYYY"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchAndFilters.endDate')}
              </label>
              <DateInput
                value={localFilters.endDate}
                onChange={(value) => handleFilterChange('endDate', value)}
                placeholder="DD/MM/YYYY"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchAndFilters.specificDate')}
              </label>
              <DateInput
                value={localFilters.date}
                onChange={(value) => handleFilterChange('date', value)}
                placeholder="DD/MM/YYYY"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleClearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {t('searchAndFilters.clearFilters')}
            </button>
            <button
              onClick={handleApplyFilters}
              className="btn-primary flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {t('searchAndFilters.applyFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;
