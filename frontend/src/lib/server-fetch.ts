/** Safe fetch for SSG/build when the API may be down — avoids noisy TypeError logs. */
export async function fetchApiOk(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}
