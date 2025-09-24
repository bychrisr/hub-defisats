import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useTranslation } from '../hooks/useTranslation';

interface LanguageSelectorProps {
  variant?: 'header' | 'card' | 'dropdown';
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'header',
  showLabels = true,
  compact = false,
  className = ''
}: LanguageSelectorProps) {
  const { t, changeLanguage, getCurrentLanguage, isPortuguese, isEnglish } = useTranslation();

  const languages = [
    { 
      code: 'pt-BR', 
      name: 'Português (BR)', 
      flag: '🇧🇷',
      nativeName: 'Português'
    },
    { 
      code: 'en-US', 
      name: 'English (US)', 
      flag: '🇺🇸',
      nativeName: 'English'
    },
  ];

  const handleLanguageChange = (languageCode: 'pt-BR' | 'en-US') => {
    changeLanguage(languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === getCurrentLanguage());

  if (variant === 'header') {
    if (compact) {
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="flex space-x-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as 'pt-BR' | 'en-US')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  lang.code === getCurrentLanguage()
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <div className="flex space-x-2">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={lang.code === getCurrentLanguage() ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLanguageChange(lang.code as 'pt-BR' | 'en-US')}
              className="flex items-center space-x-2"
            >
              <span>{lang.flag}</span>
              {showLabels && (
                <span className="text-xs">{lang.nativeName}</span>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>{t('settings.language')}</span>
          </CardTitle>
          <CardDescription>
            {t('settings.language_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                lang.code === getCurrentLanguage()
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleLanguageChange(lang.code as 'pt-BR' | 'en-US')}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{lang.name}</div>
                </div>
              </div>
              {lang.code === getCurrentLanguage() && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.flag}</span>
          {showLabels && (
            <span>{currentLanguage?.nativeName}</span>
          )}
        </Button>
        
        {/* Dropdown content would go here */}
        <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-md shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as 'pt-BR' | 'en-US')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-muted transition-colors ${
                lang.code === getCurrentLanguage() ? 'bg-primary/10' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-xs text-muted-foreground">{lang.name}</div>
              </div>
              {lang.code === getCurrentLanguage() && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// Hook para usar o seletor de idioma
export const useLanguageSelector = () => {
  const { changeLanguage, getCurrentLanguage, isPortuguese, isEnglish } = useTranslation();

  const switchToPortuguese = () => changeLanguage('pt-BR');
  const switchToEnglish = () => changeLanguage('en-US');

  return {
    changeLanguage,
    getCurrentLanguage,
    isPortuguese,
    isEnglish,
    switchToPortuguese,
    switchToEnglish,
  };
};
