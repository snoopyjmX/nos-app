export const logger = {
  warn: (message: string, context?: any) => {
    if (__DEV__) {
      if (context) {
        console.warn(message, context);
      } else {
        console.warn(message);
      }
    }
  },
  error: (message: string, context?: any) => {
    if (__DEV__) {
      if (context) {
        console.error(message, context);
      } else {
        console.error(message);
      }
    }
  }
};
