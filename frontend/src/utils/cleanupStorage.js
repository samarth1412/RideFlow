/**
 * Cleanup utility to remove unnecessary localStorage items
 * Only keeps authentication token
 */

export const cleanupLocalStorage = () => {
  try {
    // Get token before cleanup
    const token = localStorage.getItem('token');
    
    // List of items to remove
    const itemsToRemove = [
      'demoTransactions',
      'demoWalletOverrides'
    ];
    
    // Remove each item
    itemsToRemove.forEach(item => {
      if (localStorage.getItem(item)) {
        localStorage.removeItem(item);
        console.log(`Cleaned up: ${item}`);
      }
    });
    
    // Keep only token
    localStorage.clear();
    if (token) {
      localStorage.setItem('token', token);
      console.log('localStorage cleaned - token preserved');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to cleanup localStorage:', error);
    return false;
  }
};

/**
 * Check if cleanup is needed
 */
export const needsCleanup = () => {
  return localStorage.getItem('demoTransactions') !== null || 
         localStorage.getItem('demoWalletOverrides') !== null;
};
