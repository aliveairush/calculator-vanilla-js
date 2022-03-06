// Helper functions
export const peek = (stack) => stack[stack.length - 1];

export const doesLastNumberContainPeriod = (string) => /\d+\.\d+/.test(string);

export const isANumber = (record) => /\d+\.\d+|\d+/.test(record);

/** Splitting math expression on math chunks,
 1) Take if in the beginning is negative numbers with period
 2) Take if in the beginning is negative  numbers
 3) Take positive numbers with period
 4) Take Positive numbers
 5) Take parenthesis and math signs
 **/
export const splitOnMathChunks = (string) => string.match(/^-\d+\.\d+|^-\d+|\d+\.\d+|\d+|[()+-/*//]/g);

export const isEmpty = (array) => array.length === 0;