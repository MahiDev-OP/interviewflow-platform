const LOCAL_API_URL = "http://localhost:8090";

function normalizeApiBaseUrl(rawValue?: string) {
  const cleanedValue = rawValue?.replace(/^\uFEFF/, "").trim();

  if (!cleanedValue) {
    return process.env.NODE_ENV === "development" ? LOCAL_API_URL : "";
  }

  const withProtocol = /^[a-z]+:\/\//i.test(cleanedValue)
    ? cleanedValue
    : cleanedValue.startsWith("localhost") || cleanedValue.startsWith("127.0.0.1")
      ? `http://${cleanedValue}`
      : `https://${cleanedValue}`;

  const normalizedUrl = new URL(withProtocol);
  normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/+$/, "");

  return normalizedUrl.toString().replace(/\/$/, "");
}

function buildApiUrl(path: string) {
  const apiBaseUrl = normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const cleanedPath = path.replace(/^\uFEFF/, "").trim().replace(/^\/+/, "");
  return new URL(cleanedPath, `${apiBaseUrl}/`).toString();
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildApiUrl(path), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const errorPayload = (await response.json()) as { message?: string; error?: string };
      message = errorPayload.message ?? errorPayload.error ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}
