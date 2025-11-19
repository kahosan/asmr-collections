import type { ValidationTargets } from 'hono';
import type { ZodError, ZodType } from 'zod';
import { zValidator as zv } from '@hono/zod-validator';
import { core } from 'zod';

export function zValidator<T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) {
  return zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({
        message: '请求数据验证失败',
        data: formatZodError(result.error as any)
      }, 400);
    }
  });
}

export function formatZodError(e: ZodError) {
  return e.issues.map(issue => {
    const path = core.toDotPath(issue.path);
    // Invalid input: expected number, received string

    if (issue.code === 'invalid_type') {
      const received = /expected (\w+), received (\w+)/.exec(issue.message)?.at(2);
      return `预期类型 ${issue.expected}, 但 ${path || 'data'} 获取的类型为 ${received || 'unknown'}`;
    }

    return `${issue.message}${path ? ` at ${path}` : ''}`;
  });
}
