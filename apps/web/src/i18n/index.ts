import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

const savedLng =
  typeof window !== "undefined"
    ? (localStorage.getItem("i18n-language") ?? "pt-BR")
    : "pt-BR";

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: savedLng,
  fallbackLng: "pt-BR",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18n-language", lng);
});

export default i18n;
