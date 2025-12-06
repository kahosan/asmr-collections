import * as z from 'zod';

import { STORAGE_TYPES } from './constants';

export type LocalStorageConfig = z.infer<typeof LocalStorageConfigSchema>;
export const LocalStorageConfigSchema: z.ZodObject<{
  path: z.ZodString
}> = z.object({
  path: z.string().min(1, { message: '本地路径不能为空' })
});

export type WebDAVStorageConfig = z.infer<typeof WebDAVStorageConfigSchema>;
export const WebDAVStorageConfigSchema: z.ZodObject<{
  url: z.ZodURL
  path: z.ZodDefault<z.ZodString>
  username: z.ZodString
  password: z.ZodString
}> = z.object({
  url: z.url({ message: '请输入有效的 URL 地址' }),
  path: z.string().default('/'),
  username: z.string().min(1, { message: '用户名不能为空' }),
  password: z.string().min(1, { message: '密码不能为空' })
});

const CommonFields = z.object({
  description: z.string().optional(),
  priority: z.number().int().optional()
});

export type StorageConfigBody = z.infer<typeof StorageConfigBodySchema>;
export const StorageConfigBodySchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
  description: z.ZodOptional<z.ZodString>
  priority: z.ZodOptional<z.ZodNumber>
  name: z.ZodDefault<z.ZodString>
  type: z.ZodLiteral<'local'>
  config: z.ZodObject<{
    path: z.ZodString
  }>
}>, z.ZodObject<{
  description: z.ZodOptional<z.ZodString>
  priority: z.ZodOptional<z.ZodNumber>
  name: z.ZodDefault<z.ZodString>
  type: z.ZodLiteral<'webdav'>
  config: z.ZodObject<{
    url: z.ZodURL
    path: z.ZodDefault<z.ZodString>
    username: z.ZodString
    password: z.ZodString
  }>
}>], 'type'> = z.discriminatedUnion('type', [
  CommonFields.extend({
    name: z.string().min(1, { message: '名称不能为空' }).default('本地存储'),
    type: z.literal(STORAGE_TYPES.LOCAL),
    config: LocalStorageConfigSchema
  }),
  CommonFields.extend({
    name: z.string().min(1, { message: '名称不能为空' }).default('WebDAV'),
    type: z.literal(STORAGE_TYPES.WEBDAV),
    config: WebDAVStorageConfigSchema
  })
]);

export type Storage = z.infer<typeof StorageSchema>;
export const StorageSchema: z.ZodObject<{
  id: z.ZodNumber
  name: z.ZodString
  description: z.ZodNullable<z.ZodString>
  type: z.ZodString
  priority: z.ZodNumber
  config: z.ZodUnion<readonly [z.ZodObject<{
    path: z.ZodString
  }>, z.ZodObject<{
    url: z.ZodURL
    path: z.ZodDefault<z.ZodString>
    username: z.ZodString
    password: z.ZodString
  }>]>
  createdAt: z.ZodCoercedDate
  updatedAt: z.ZodCoercedDate
}> = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  priority: z.number().int(),
  config: z.union([LocalStorageConfigSchema, WebDAVStorageConfigSchema]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const StorageParamSchema: z.ZodObject<{
  id: z.ZodCoercedNumber
}> = z.object({
  id: z.coerce.number().int().positive()
});
