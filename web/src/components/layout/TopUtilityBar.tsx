import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Eye, Languages } from 'lucide-react';

export const TopUtilityBar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { textSize, setTextSize, highContrast, toggleHighContrast } = useAccessibility();

  return (
    <div className="bg-gov-navy-900 text-gray-200 text-xs py-1 px-2.5 sm:px-4 border-b border-gov-navy-800">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-1.5 sm:gap-2">
        {/* Left Accessibility Links */}
        <div className="hidden sm:flex items-center space-x-4">
          <a
            href="#main-content"
            className="hover:text-white transition focus:outline-none focus:ring-1 focus:ring-amber-400 px-1"
          >
            {t('skip.to.content')}
          </a>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1 text-gray-300">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('screen.reader')}</span>
          </span>
        </div>

        {/* Right Accessibility & Language Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Text Size Controls */}
          <div className="flex items-center space-x-1 bg-gov-navy-800 px-1.5 py-0.5 rounded border border-gov-navy-700">
            <span className="text-gray-400 text-[11px] mr-1">{t('text.size')}:</span>
            <button
              onClick={() => setTextSize('sm')}
              className={`px-1 rounded font-bold hover:text-white ${textSize === 'sm' ? 'bg-amber-500 text-gov-navy-900' : ''}`}
              title="Small Text"
            >
              A-
            </button>
            <button
              onClick={() => setTextSize('base')}
              className={`px-1 rounded font-bold hover:text-white ${textSize === 'base' ? 'bg-amber-500 text-gov-navy-900' : ''}`}
              title="Normal Text"
            >
              A
            </button>
            <button
              onClick={() => setTextSize('lg')}
              className={`px-1 rounded font-bold hover:text-white ${textSize === 'lg' ? 'bg-amber-500 text-gov-navy-900' : ''}`}
              title="Large Text"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`px-2 py-0.5 rounded border text-[11px] transition ${
              highContrast
                ? 'bg-amber-400 text-gov-navy-900 font-bold border-amber-500'
                : 'bg-gov-navy-800 text-gray-300 border-gov-navy-700 hover:text-white'
            }`}
          >
            {t('high.contrast')}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center space-x-1 pl-2 border-l border-gov-navy-700">
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] ${language === 'en' ? 'font-bold text-amber-400 underline' : 'text-gray-300 hover:text-white'}`}
            >
              English
            </button>
            <span className="text-gray-500">/</span>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded text-[11px] ${language === 'hi' ? 'font-bold text-amber-400 underline' : 'text-gray-300 hover:text-white'}`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
