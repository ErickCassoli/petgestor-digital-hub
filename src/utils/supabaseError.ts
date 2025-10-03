interface SupabaseLikeError {
  message?: string;
  code?: string;
  hint?: string;
  details?: string;
}

interface FriendlyError {
  title: string;
  description: string;
}

export function buildSupabaseToast(
  error: unknown,
  fallback: FriendlyError
): FriendlyError {
  if (error && typeof error === 'object') {
    const supabaseError = error as SupabaseLikeError;
    const message = supabaseError.message?.trim();
    const hint = supabaseError.hint?.trim();

    if (
      supabaseError.code === 'P0001' ||
      (message && message.toLowerCase().includes('limite do plano free'))
    ) {
      return {
        title: 'Limite do plano Free atingido',
        description: message || hint || fallback.description,
      };
    }

    if (message) {
      return {
        title: fallback.title,
        description: message,
      };
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      title: fallback.title,
      description: error.message,
    };
  }

  return fallback;
}
