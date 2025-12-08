// src/utils/helpers.ts

/**
 * Format currency into Rands
 */
export const formatCurrency = (amount: number): string => {
  return "R" + amount.toFixed(2);
};

/**
 * Calculate average from an array of numbers
 */
export const calculateAverage = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/**
 * Generate a random reference string
 */
export const generateReference = (prefix: string = "TX"): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Format a date into YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};
