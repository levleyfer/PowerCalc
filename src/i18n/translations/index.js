import { common } from "./common";
import { authText } from "./auth";
import { historyText } from "./history";
import { acText } from "./ac";
import { lightingText } from "./lighting";
import { boilerText } from "./boiler";

export const translations = {
  en: {
    ...common.en,
    ...authText.en,
    ...historyText.en,
    ...acText.en,
    ...lightingText.en,
    ...boilerText.en,
  },

  he: {
    ...common.he,
    ...authText.he,
    ...historyText.he,
    ...acText.he,
    ...lightingText.he,
    ...boilerText.he,
  },
};
