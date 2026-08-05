/**
 * 日期时间工具函数
 *
 * 约定：后端数据库统一存储【北京时间】（naive datetime，无时区后缀）。
 * 因此前端不再额外 +8h，直接解析后端返回的时间字符串即可。
 * （目标用户时区为 UTC+8，`new Date("YYYY-MM-DDTHH:MM:SS")` 在本地显示即为北京时间）
 */

/**
 * 解析后端返回的时间字符串为 Date 对象
 * @param utcTime - 后端返回的时间字符串（北京时间）或 Date 对象
 * @returns 解析后的 Date 对象
 */
export function toBeijingTime(utcTime: string | Date | null | undefined): Date | null {
  if (!utcTime) return null;
  try {
    const date = new Date(utcTime);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * 格式化时间为本地时间字符串
 * @param utcTime - 后端返回的时间字符串（北京时间）或 Date 对象
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
 * @param utcTime - 后端返回的时间字符串（北京时间）或 Date 对象
 * @returns 友好时间字符串
 */
export function formatTimeAgo(utcTime: string | Date | null | undefined): string {
  if (!utcTime) return '';
  try {
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
