import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (language: 'pt-BR' | 'en-US') => {
    i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => {
    return i18n.language as 'pt-BR' | 'en-US';
  };

  const isPortuguese = () => {
    return i18n.language === 'pt-BR';
  };

  const isEnglish = () => {
    return i18n.language === 'en-US';
  };

  return {
    t,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isPortuguese,
    isEnglish,
  };
};
