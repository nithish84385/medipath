import { createContext, useContext, useState, useCallback } from 'react';
import { genAI } from './gemini';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('English');
  const [cache, setCache] = useState({});

  const translate = useCallback(async (text, targetLang = language) => {
    if (!text || targetLang === 'English') return text;
    
    const cacheKey = `${text}_${targetLang}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Translate the following medical text into ${targetLang}. Return ONLY the translated text, nothing else. Text: "${text}"`;
      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();
      
      setCache(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  }, [language, cache]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}
