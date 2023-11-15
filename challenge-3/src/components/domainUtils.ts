// domainUtils.ts

/**
 * Check if a domain is available by calling an API endpoint.
 * @param {string} domain - Domain to check availability for.
 * @returns {Promise<boolean>} - True if available, false otherwise.
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
    const response = await fetch(`/api/DomainAvailable?domain=${domain}`);
    const data = await response.json();
    return data.available;
  }
  