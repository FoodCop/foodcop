/**
 * Simple cookie utility functions for browser environments
 */

export const cookieUtils = {
  /**
   * Set a cookie with optional expiration and path
   */
  set(name: string, value: string, options: { expires?: number; path?: string } = {}) {
    const { expires = 7, path = '/' } = options;
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000); // expires in days
    
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=${path}`;
  },

  /**
   * Get a cookie value by name
   */
  get(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  },

  /**
   * Delete a cookie by setting it to expire in the past
   */
  delete(name: string, path: string = '/') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  },

  /**
   * Store the return path for after authentication
   */
  setReturnPath(path: string) {
    this.set('authReturnPath', path, { expires: 1 }); // 1 day expiration
  },

  /**
   * Get and clear the stored return path
   */
  getAndClearReturnPath(): string | null {
    const path = this.get('authReturnPath');
    if (path) {
      this.delete('authReturnPath');
    }
    return path;
  }
};