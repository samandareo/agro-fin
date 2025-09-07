import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateToDDMMYYYY, formatDateToISO, isValidDDMMYYYY } from '../utils/fileUtils';

const DateInput = ({ value, onChange, placeholder = "DD/MM/YYYY", className = "" }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateToDDMMYYYY(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    const valid = !inputValue || isValidDDMMYYYY(inputValue);
    setIsValid(valid);
    if (inputValue && valid) {
      const isoDate = formatDateToISO(inputValue);
      onChange(isoDate);
    } else if (!inputValue) {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (!displayValue) {
      onChange('');
      return;
    }
    
    if (!isValidDDMMYYYY(displayValue)) {
      setDisplayValue(value ? formatDateToDDMMYYYY(value) : '');
      setIsValid(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${className} pr-10 ${!isValid ? 'border-red-500 focus:ring-red-500' : ''}`}
          maxLength={10}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {!isValid && (
        <p className="text-xs text-red-500 mt-1">Please use DD/MM/YYYY format</p>
      )}
    </div>
  );
};

export default DateInput;
