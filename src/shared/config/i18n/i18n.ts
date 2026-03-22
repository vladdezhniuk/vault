"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import transactionEN from "./locales/en/transaction.json";
import depositEN from "./locales/en/deposit.json";
import withdrawEN from "./locales/en/withdraw.json";
import vaultEN from "./locales/en/vault.json";
import chartEN from "./locales/en/chart.json";

const resources = {
  en: {
    transaction: transactionEN,
    deposit: depositEN,
    withdraw: withdrawEN,
    vault: vaultEN,
    chart: chartEN,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  ns: ["transaction", "deposit", "withdraw", "vault", "chart"],
  defaultNS: "transaction",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
