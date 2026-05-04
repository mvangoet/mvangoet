import type { Dictionary } from "./i18n";

export function resolveFlashMessage(dictionary: Dictionary, code?: string) {
  switch (code) {
    case "created":
      return dictionary.messages.created;
    case "invalid_form":
      return dictionary.messages.invalidForm;
    case "invalid_credentials":
      return dictionary.auth.invalidCredentials;
    case "login_required":
      return dictionary.messages.loginRequired;
    case "forbidden":
      return dictionary.messages.forbidden;
    default:
      return undefined;
  }
}
