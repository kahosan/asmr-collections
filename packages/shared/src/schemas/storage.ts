import * as z from 'zod';

import { STORAGE_TYPES } from './constants';

export type StorageType = z.infer<typeof StorageTypeSchema>;
export const StorageTypeSchema: z.ZodUnion<readonly [z.ZodLiteral<'local'>, z.ZodLiteral<'webdav'>]> =
  z.union([z.literal(STORAGE_TYPES.LOCAL), z.literal(STORAGE_TYPES.WEBDAV)]);

export type LocalStorageConfig = z.infer<typeof LocalStorageConfigSchema>;
export const LocalStorageConfigSchema: z.ZodObject<{
  path: z.ZodString
}> = z.object({
  path: z.string().min(1, { message: '本地路径不能为空' }).refine(val => {
    // Must be an absolute path
    return val.startsWith('/');
  }, { message: '本地路径必须是绝对路径' })
});

export type WebDAVStorageConfig = z.infer<typeof WebDAVStorageConfigSchema>;
export const WebDAVStorageConfigSchema: z.ZodObject<{
  url: z.ZodURL
  path: z.ZodDefault<z.ZodString>
  username: z.ZodString
  password: z.ZodString
}> = z.object({
  url: z.url({ message: '请输入有效的 URL 地址' }),
  path: z.string().default('/').refine(val => {
    // Must be an absolute path
    return val.startsWith('/');
  }, { message: 'WebDAV 路径必须是绝对路径' }),
  username: z.string().min(1, { message: '用户名不能为空' }),
  password: z.string().min(1, { message: '密码不能为空' })
});

const CommonFields = z.object({
  description: z.string().nullish(),
  priority: z.number().int().optional()
});

export type StorageConfigBody = z.infer<typeof StorageConfigBodySchema>;
export const StorageConfigBodySchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
  description: z.ZodOptional<z.ZodNullable<z.ZodString>>
  priority: z.ZodOptional<z.ZodNumber>
  name: z.ZodDefault<z.ZodString>
  type: z.ZodLiteral<'local'>
  config: z.ZodObject<{
    path: z.ZodString
  }>
}>, z.ZodObject<{
  description: z.ZodOptional<z.ZodNullable<z.ZodString>>
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

export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export const StorageConfigSchema: z.ZodUnion<[z.ZodObject<{
  path: z.ZodString
}>, z.ZodObject<{
  url: z.ZodURL
  path: z.ZodDefault<z.ZodString>
  username: z.ZodString
  password: z.ZodString
}>]> = LocalStorageConfigSchema.or(WebDAVStorageConfigSchema);

export type Storage = z.infer<typeof StorageSchema>;
export const StorageSchema: z.ZodIntersection<z.ZodDiscriminatedUnion<[z.ZodObject<{
  description: z.ZodOptional<z.ZodNullable<z.ZodString>>
  priority: z.ZodOptional<z.ZodNumber>
  name: z.ZodDefault<z.ZodString>
  type: z.ZodLiteral<'local'>
  config: z.ZodObject<{
    path: z.ZodString
  }>
}>, z.ZodObject<{
  description: z.ZodOptional<z.ZodNullable<z.ZodString>>
  priority: z.ZodOptional<z.ZodNumber>
  name: z.ZodDefault<z.ZodString>
  type: z.ZodLiteral<'webdav'>
  config: z.ZodObject<{
    url: z.ZodURL
    path: z.ZodDefault<z.ZodString>
    username: z.ZodString
    password: z.ZodString
  }>
}>], 'type'>, z.ZodObject<{
  id: z.ZodNumber
  createdAt: z.ZodCoercedDate
  updatedAt: z.ZodCoercedDate
}>> = z.intersection(StorageConfigBodySchema, z.object({
  id: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}));

export const StorageParamSchema: z.ZodObject<{
  id: z.ZodCoercedNumber
}> = z.object({
  id: z.coerce.number().int().positive()
});
