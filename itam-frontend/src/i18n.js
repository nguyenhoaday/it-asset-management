import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import transaltionEn from "./locales/en.json";
import transaltionVI from "./locales/vi.json";

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: transaltionEn },
        vi:  { translation: transaltionVI }
    },
    lng: localStorage.getItem("language") || "vi",
    fallbackLng: "vi",
    interpolation: {
        escapeValue: false
    }
});

export default i18n;