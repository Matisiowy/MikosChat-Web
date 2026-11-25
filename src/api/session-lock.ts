let queue: Promise<unknown> = Promise.resolve()

export function withSessionLock<T>(
  operation: () => Promise<T>,
): Promise<T> {
  if (navigator.locks) {
    return navigator.locks.request(
      'mikoschat-auth-session',
      operation,
    )
  }

  const result = queue.then(operation, operation)

  queue = result.then(
    () => undefined,
    () => undefined,
  )

  return result
}

export function announceSessionChange() {
  try {
    localStorage.setItem(
      'mikoschat-session-event',
      crypto.randomUUID(),
    )
  } catch {
    // Storage may be disabled by browser privacy settings.
  }
}
