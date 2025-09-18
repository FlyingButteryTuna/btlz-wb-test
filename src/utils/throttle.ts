let lastCall = 0;
const MIN_INTERVAL_MS = 200; // < 5 rps

export async function throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed < MIN_INTERVAL_MS) {
        await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
    }
    lastCall = Date.now();
    return fn();
}
