/**
 * Fitness calculation utilities
 */

/**
 * Calculate Estimated 1 Rep Max using Epley formula
 * e1RM = weight × (1 + reps/30)
 *
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @returns Estimated 1 Rep Max
 */
export function calculateE1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) {
    return 0;
  }
  if (reps === 1) {
    return weight;
  } // Already 1RM

  // Epley formula
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate Volume (weight × reps)
 *
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @returns Volume
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Progress metric types
 */
export type ProgressMetric = 'e1rm' | 'volume' | 'weight';

/**
 * Get the display value for a set based on the selected metric
 */
export function getProgressValue(weight: number, reps: number, metric: ProgressMetric): number {
  switch (metric) {
    case 'e1rm':
      return calculateE1RM(weight, reps);
    case 'volume':
      return calculateVolume(weight, reps);
    case 'weight':
    default:
      return weight;
  }
}

/**
 * Get the label suffix for the metric (for Y-axis)
 */
export function getMetricSuffix(metric: ProgressMetric): string {
  switch (metric) {
    case 'e1rm':
      return ' kg (e1RM)';
    case 'volume':
      return ' kg×reps';
    case 'weight':
    default:
      return ' kg';
  }
}
