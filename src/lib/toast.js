'use client';

export const toast = {
  success: (msg) => {
    try {
      if (typeof window !== 'undefined' && window?.toast) {
        window.toast(msg);
        return;
      }
    } catch (e) {
      // ignore
    }

    console.log('TOAST success:', msg);
  },

  error: (msg) => {
    try {
      if (typeof window !== 'undefined' && window?.toast) {
        window.toast(msg);
        return;
      }
    } catch (e) {
      // ignore
    }

    console.error('TOAST error:', msg);
  },
};

export default toast;
