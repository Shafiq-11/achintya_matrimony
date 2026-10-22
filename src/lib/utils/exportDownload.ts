/**
 * Securely triggers an export file download in the browser.
 * - Prevents saving JSON error responses as Excel files.
 * - Preserves the exact filename with proper .xlsx or .csv extension.
 * - Delays object URL revocation so Chromium engines never fall back to UUID filenames.
 */
export async function downloadExportFile({
  url,
  defaultFilename,
  onStart,
  onSuccess,
  onError,
}: {
  url: string;
  defaultFilename: string;
  onStart?: () => void;
  onSuccess?: (filename: string) => void;
  onError?: (errorMessage: string) => void;
}): Promise<void> {
  try {
    if (onStart) onStart();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv, */*',
      },
    });

    if (!response.ok) {
      let errorText = `Export failed with HTTP status ${response.status}.`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorText = errorJson.error;
        }
      } catch {
        // Response is not JSON
      }
      throw new Error(errorText);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || 'Received an unexpected JSON error response instead of spreadsheet file.');
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Exported file is empty (0 bytes).');
    }

    // Extract filename from Content-Disposition header if available
    let filename = defaultFilename;
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1].trim());
      } else {
        const standardMatch = disposition.match(/filename="?([^";\n]+)"?/i);
        if (standardMatch && standardMatch[1]) {
          filename = standardMatch[1].trim();
        }
      }
    }

    // Ensure the filename always ends with the expected extension
    if (url.includes('format=csv') && !filename.endsWith('.csv')) {
      filename += '.csv';
    } else if (!url.includes('format=csv') && !filename.endsWith('.xlsx')) {
      filename += '.xlsx';
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Chromium needs the Object URL to remain active while background download thread writes to disk
    // Delaying cleanup by 30 seconds prevents UUID fallback
    setTimeout(() => {
      try {
        window.URL.revokeObjectURL(objectUrl);
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      } catch {
        // Ignored
      }
    }, 30000);

    if (onSuccess) onSuccess(filename);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred during export.';
    if (onError) onError(message);
  }
}
