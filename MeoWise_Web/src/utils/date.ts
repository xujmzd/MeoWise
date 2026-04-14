/**
 * 日期时间工具函数
 * 处理 UTC 时间到本地时间（北京时区 UTC+8）的转换
 */

// 北京时区偏移（毫秒）
const BEIJING_OFFSET = 8 * 60 * 60 * 1000;

/**
 * 将 UTC 时间转换为北京时间
 * @param utcTime - UTC 时间字符串或 Date 对象
 * @returns 北京时间的 Date 对象
 */
export function toBeijingTime(utcTime: string | Date | null | undefined): Date | null {
  if (!utcTime) return null;
  try {
    const date = new Date(utcTime);
    if (isNaN(date.getTime())) return null;
    // 加上8小时偏移
    return new Date(date.getTime() + BEIJING_OFFSET);
  } catch {
    return null;
  }
}

/**
 * 格式化时间为本地时间字符串
 * @param utcTime - UTC 时间字符串或 Date 对象
 * @returns 本地时间字符串
 */
export function formatLocalTime(utcTime: string | Date | null | undefined): string {
  const beijingDate = toBeijingTime(utcTime);
  if (!beijingDate) return '--';
  return beijingDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化时间为友好显示（如"2小时前"）
 * @param utcTime - UTC 时间字符串或 Date 对象
 * @returns 友好时间字符串
 */
export function formatTimeAgo(utcTime: string | Date | null | undefined): string {
  if (!utcTime) return '';
  try {
    // 先转换为北京时间
    const beijingDate = toBeijingTime(utcTime);
    if (!beijingDate) return '';
    const diffMs = Date.now() - beijingDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return formatLocalTime(utcTime);
  } catch {
    return '';
  }
}