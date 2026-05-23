export function getApiBaseUrl(): string {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const backendParam = urlParams.get('backend');

    if (backendParam) {
      localStorage.setItem('previewBackendUrl', backendParam);
      // Remove query param from URL and reload cleanly
      window.location.href = window.location.pathname;
    }

    const savedBackendUrl = localStorage.getItem('previewBackendUrl');
    if (savedBackendUrl) {
      apiUrl = savedBackendUrl;
    }
  }

  return apiUrl;
}
