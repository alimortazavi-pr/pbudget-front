import { getTranslator } from "@/i18n";
import axios from "axios";

const API_ERROR_KEYS: Record<string, string> = {
  "Internal server error": "errors.internalServer",
  "Please enter the 'Type (0 or 1)' correctly": "errors.invalidTransactionType",
  "Please enter the 'type (0 or 1)' correctly": "errors.invalidTransactionType",
  "remindDaysBefore must not be greater than 30": "errors.remindDaysRange",
  "remindDaysBefore must not be less than 0": "errors.remindDaysRange",
  "روز سررسید باید بین ۱ تا ۳۱ باشد": "errors.dueDayRange",
  "تعداد روز یادآوری باید بین ۰ تا ۳۰ باشد": "errors.remindDaysRange",
};

const VALIDATION_FIELD_KEYS: Record<string, string> = {
  remindDaysBefore: "errors.fields.remindDaysBefore",
  dueDayOfMonth: "errors.fields.dueDayOfMonth",
  title: "errors.fields.title",
  amount: "errors.fields.amount",
  monthlyLimit: "errors.fields.monthlyLimit",
  price: "errors.fields.price",
  categoryId: "errors.fields.categoryId",
  parentId: "errors.fields.parentId",
  color: "errors.fields.color",
  email: "errors.fields.email",
  password: "errors.fields.password",
};

function fieldLabel(field: string): string {
  const t = getTranslator();
  const key = VALIDATION_FIELD_KEYS[field];
  return key ? t(key) : field;
}

function translateValidationKeyMessage(message: string): string | null {
  const t = getTranslator();
  const mustBeString = message.match(/^(\w+)\s+must be a string$/i);
  if (mustBeString) {
    return t("errors.fieldInvalidFormat", {
      field: fieldLabel(mustBeString[1]),
    });
  }

  const mustBeNumber = message.match(/^(\w+)\s+must be (?:a )?number/i);
  if (mustBeNumber) {
    return t("errors.fieldMustBeNumber", {
      field: fieldLabel(mustBeNumber[1]),
    });
  }

  const mustNotBeEmpty = message.match(/^(\w+)\s+should not be empty$/i);
  if (mustNotBeEmpty) {
    return t("errors.fieldRequired", {
      field: fieldLabel(mustNotBeEmpty[1]),
    });
  }

  const match = message.match(/^(\w+)\s+must not be (greater than|less than)\s+(.+)$/i);
  if (!match) return null;

  const [, field, direction, bound] = match;
  const label = fieldLabel(field);
  if (direction === "greater than") {
    return t("errors.fieldMustNotBeGreater", { field: label, bound });
  }
  return t("errors.fieldMustNotBeLess", { field: label, bound });
}

function translateApiMessage(message: string): string {
  const t = getTranslator();
  const trimmed = message.trim();
  const mapped = API_ERROR_KEYS[trimmed];
  if (mapped) return t(mapped);
  return translateValidationKeyMessage(trimmed) ?? trimmed;
}

function normalizeMessagePayload(message: unknown): string | null {
  if (typeof message === "string" && message.trim()) {
    return translateApiMessage(message);
  }

  if (Array.isArray(message)) {
    const parts = message
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map(translateApiMessage);
    const unique = [...new Set(parts)];
    if (unique.length > 0) return unique.join(" · ");
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const t = getTranslator();
  const resolvedFallback = fallback ?? t("errors.default");

  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: unknown } | undefined;
    const fromPayload = normalizeMessagePayload(payload?.message);
    if (fromPayload) return fromPayload;
  }

  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
    return error.message;
  }

  return resolvedFallback;
}
