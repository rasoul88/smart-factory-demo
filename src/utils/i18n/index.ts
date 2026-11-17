import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// BASE_URL honours vite `base` so the file resolves under a subdirectory
// deployment (e.g. GitHub Pages project sites) as well as at the root.
export const TRANSLATION_URL = `${import.meta.env.BASE_URL}locales/fa/translation.json`;

export const initI18n = async (): Promise<void> => {
  const response = await fetch(TRANSLATION_URL);
  const translation = await response.json();

  await i18n.use(initReactI18next).init({
    lng: "fa",
    fallbackLng: "fa",
    debug: false,
    interpolation: { escapeValue: false },
    resources: {
      fa: { translation },
    },
  });
};

export default i18n;
