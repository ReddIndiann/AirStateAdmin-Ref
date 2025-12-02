/**
 * Utility functions for generating deep links to customer app
 */

export interface DeepLinkParams {
  requestId?: string;
  type: 'query' | 'completion' | 'general';
  section?: 'upload' | 'results' | 'requests' | 'detail';
}

/**
 * Generates a deep link URL for the customer app
 * @param params - Parameters for generating the deep link
 * @returns The deep link URL
 */
export const generateDeepLink = (params: DeepLinkParams): string => {
  // Get base URL from environment variable or use default
  // Default is the customer web app URL
  const baseUrl = import.meta.env.VITE_CUSTOMER_APP_URL || 'https://airstatelaps.com';
  
  // Build the deep link path based on type and section
  let path = '';
  let queryParams: string[] = [];
  
  if (params.requestId) {
    queryParams.push(`documentId=${params.requestId}`);
  }
  
  switch (params.type) {
    case 'query':
      // For queries (image not clear), link to payment-details page (upload section)
      path = '/payment-details';
      break;
      
    case 'completion':
      // For completions (results ready), link to payment-details page (results section)
      path = '/payment-details';
      break;
      
    case 'general':
      // For general messages, link to payment-details page
      path = '/payment-details';
      break;
      
    default:
      path = '/payment-details';
  }
  
  // Build the full URL with query parameters
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  return `${baseUrl}${path}${queryString}`;
};

/**
 * Generates a short link message with deep link
 * @param message - The base message
 * @param deepLink - The deep link URL
 * @param isSMS - Whether this is for SMS (affects formatting)
 * @returns Message with deep link appended
 */
export const addDeepLinkToMessage = (message: string, deepLink: string, isSMS: boolean = false): string => {
  // Ensure URL starts with https:// for proper link detection in SMS
  let formattedLink = deepLink;
  if (!deepLink.startsWith('http://') && !deepLink.startsWith('https://')) {
    formattedLink = `https://${deepLink}`;
  }
  
  if (isSMS) {
    // For SMS, use a shorter format that's more likely to be clickable
    return `${message}\n\nView details: ${formattedLink}`;
  } else {
    // For Email, can use more descriptive text
    return `${message}\n\nClick here to view: ${formattedLink}`;
  }
};

/**
 * Generates a message with deep link for query notifications
 * @param requestId - The request document ID
 * @param baseMessage - Optional custom base message
 * @param isSMS - Whether this is for SMS (affects formatting)
 * @returns Message with deep link
 */
export const generateQueryMessage = (requestId: string, baseMessage?: string, isSMS: boolean = false): string => {
  const defaultMessage = "Your document image is not clear. Please resend a clearer version.";
  const message = baseMessage || defaultMessage;
  const deepLink = generateDeepLink({ 
    type: 'query', 
    requestId,
    section: 'upload' 
  });
  return addDeepLinkToMessage(message, deepLink, isSMS);
};

/**
 * Generates a message with deep link for completion notifications
 * @param requestId - The request document ID
 * @param baseMessage - Optional custom base message
 * @param isSMS - Whether this is for SMS (affects formatting)
 * @returns Message with deep link
 */
export const generateCompletionMessage = (requestId: string, baseMessage?: string, isSMS: boolean = false): string => {
  const defaultMessage = "Your results are ready! Please check your request details.";
  const message = baseMessage || defaultMessage;
  const deepLink = generateDeepLink({ 
    type: 'completion', 
    requestId,
    section: 'results' 
  });
  return addDeepLinkToMessage(message, deepLink, isSMS);
};

/**
 * Generates a message with deep link for general notifications
 * @param message - The base message
 * @param requestId - Optional request document ID
 * @param isSMS - Whether this is for SMS (affects formatting)
 * @returns Message with deep link
 */
export const generateGeneralMessage = (message: string, requestId?: string, isSMS: boolean = false): string => {
  const deepLink = generateDeepLink({ 
    type: 'general', 
    requestId 
  });
  return addDeepLinkToMessage(message, deepLink, isSMS);
};

