import { toast } from 'sonner';
import { match } from 'ts-pattern';
import { useImmer } from 'use-immer';
import { useCallback, useRef, useState } from 'react';

import { logger } from '~/lib/logger';
import { fetcher } from '~/lib/fetcher';
import { notifyError, parseWorkInput, writeClipboard } from '~/utils';

import type { LogType, SSEData, SSEEvent } from '~/types/batch';

export default function useBatchOperation(type: 'refresh' | 'create', setOpen: (open: boolean) => void, isSync = false) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useImmer<Array<{ type: LogType, message: string }>>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [createIds, setCreateIds] = useState<string>('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const toastIdRef = useRef<string | number>('batch-operation-toast');

  const handleStart = useCallback(async () => {
    if (isProcessing) {
      logger.warn('正在运行操作');
      return;
    };

    setLogs([]);
    setIsProcessing(true);
    toastIdRef.current = toast.loading('正在建立 SSE 连接...');
    logger.info('正在建立 SSE 连接');

    try {
      const isCreate = type === 'create';
      const url = `/api/work/batch/${type}`;
      const headers = { 'Content-Type': 'application/json' };

      if (isCreate) {
        const { validIds: targetIds, isValid, isEmpty } = parseWorkInput(createIds);

        if ((!isValid || isEmpty) && !isSync) {
          toast.warning('请输入有效 ID');
          return;
        }

        const data = await fetcher(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ids: targetIds,
            sync: isSync
          })
        });
        logger.info(data, '批量创建请求已发送，开始监听 SSE');
      };

      const es = new EventSource(url);
      eventSourceRef.current = es;

      // 通用处理函数
      const handleEvent = (event: SSEEvent, data: string) => {
        if (!data) {
          logger.warn({ event, data }, 'SSE 收到空数据，忽略');
          return;
        }

        let parsedData: unknown;
        try {
          parsedData = JSON.parse(data);
        } catch {
          logger.error('SSE 数据解析失败');
          return;
        }

        match({ event, data: parsedData } as SSEData)
          .with(({ event: 'start' }), ({ data }) => {
            const { total, message } = data;
            setProgress({ current: 0, total, percent: 0 });

            toast.info(message, { id: toastIdRef.current });
            logger.info('获取到 start 事件，操作开始');
          })
          .with({ event: 'progress' }, ({ data }) => {
            setProgress(data);
          })
          .with({ event: 'log' }, ({ data }) => {
            const { type, message } = data;
            setLogs(p => {
              p.push({ type, message });
            });
          })
          .with({ event: 'end' }, ({ data }) => {
            setIsProcessing(false); // 停止处理状态
            const { stats, message } = data;

            toast.info(message, { id: toastIdRef.current });
            logger.info(stats, '获取到 end 事件，操作结束');
          })
          .with({ event: 'error' }, ({ data }) => {
            setIsProcessing(false);

            toast.error(`操作失败: ${data.message}`, {
              id: toastIdRef.current,
              description: data.details
            });
            logger.error(data, '获取到 error 事件，操作失败');
          })
          .exhaustive();
      };

      es.addEventListener('open', () => {
        logger.info('SSE 已建立连接');
        toast.success('SSE 连接已建立', { id: toastIdRef.current });
      });

      es.addEventListener('start', e => handleEvent('start', e.data));
      es.addEventListener('progress', e => handleEvent('progress', e.data));
      es.addEventListener('log', e => handleEvent('log', e.data));
      es.addEventListener('end', e => {
        handleEvent('end', e.data);
        es.close();
      });

      es.addEventListener('error', e => {
        if ('data' in e && typeof e.data === 'string') {
          handleEvent('error', e.data);
          return es.close();
        }

        toast.error('SSE 连接错误', { id: toastIdRef.current });
        logger.error(e, 'SSE 连接错误');
        es.close();
      });
    } catch (err) {
      setIsProcessing(false);
      notifyError(err, '启动批量操作失败', {
        id: toastIdRef.current
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, setLogs, type, createIds, isSync]);

  const handleCancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();

      setLogs(p => {
        p.push({ type: 'warning', message: '操作已被用户取消' });
      });

      toast.info('已停止', {
        description: '操作已被用户取消',
        id: toastIdRef.current
      });
      logger.info('用户取消了操作');
    }
    setIsProcessing(false);
  }, [setLogs]);

  const copyLogs = () => {
    if (logs.some(({ type }) => type === 'error')) {
      const errorData = logs.filter(({ type }) => type === 'error');
      writeClipboard(JSON.stringify(errorData, null, 2));
    } else {
      toast.warning('没有错误日志', { position: 'bottom-right' });
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && isProcessing) {
      toast.warning('请先等待操作完成或点击停止', { position: 'bottom-right' });
      return;
    }
    setOpen(val);
  };

  return {
    isProcessing,
    progress,
    logs,
    handleStart,
    handleCancel,
    copyLogs,
    handleOpenChange,
    createIds,
    setCreateIds
  };
}
