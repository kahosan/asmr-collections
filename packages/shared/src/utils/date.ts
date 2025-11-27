/**
 * 格式化时间单位，确保两位数显示
 * @param unit - 时间单位（小时、分钟或秒）
 * @returns 格式化后的时间单位字符串
 */
export function formatTimeUnit(unit: number): string {
  return String(unit).padStart(2, '0');
}

/**
 * 格式化持续时间为 "HH:MM:SS" 或 "MM:SS" 格式
 * @param seconds - 持续时间，单位为秒
 * @returns 格式化后的持续时间字符串
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0)
    return `${formatTimeUnit(hrs)}:${formatTimeUnit(mins)}:${formatTimeUnit(secs)}`;

  return `${formatTimeUnit(mins)}:${formatTimeUnit(secs)}`;
}

/**
 * 格式化日期为中文格式
 * @param dateString - ISO 日期字符串
 * @returns 格式化后的日期字符串，如 "2025年11月18日 0时"
 */
export function formatChineseDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  return `${year}年${month}月${day}日 ${hour}时`;
}
