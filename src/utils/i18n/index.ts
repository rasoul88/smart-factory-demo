import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const TRANSLATION_URL = "/locales/fa/translation.json";

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
