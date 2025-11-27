/* eslint-disable @typescript-eslint/no-inferrable-types -- declaration */
export const WORK_ID_REGEX: RegExp = /\b(?:rj|bj|vj)\d{6,8}\b/gi;
export const WORK_ID_EXACT_REGEX: RegExp = /^(?:rj|bj|vj)(\d{6,8})$/i;
