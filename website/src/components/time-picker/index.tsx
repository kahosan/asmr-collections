'use client';

import type React from 'react';

import { useState, useRef, useEffect, useCallback, Activity } from 'react';
import { Clock } from 'lucide-react';

import { getHours } from 'date-fns/getHours';
import { getMinutes } from 'date-fns/getMinutes';
import { setHours } from 'date-fns/setHours';
import { setMinutes } from 'date-fns/setMinutes';
import { setSeconds } from 'date-fns/setSeconds';
import { setMilliseconds } from 'date-fns/setMilliseconds';
import { addHours } from 'date-fns/addHours';
import { addMinutes } from 'date-fns/addMinutes';

import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

import { motion } from 'framer-motion';

import { cn } from '~/lib/utils';

interface TimePickerProps {
  onConfirm: (timestamp: number) => void
  onCancelTimer: () => void
  open: boolean
  setOpen: (open: boolean) => void
}

// Clock dimensions constants
const CLOCK_DIAMETER = 256; // size-64 in pixels
const CLOCK_RADIUS = CLOCK_DIAMETER / 2; // 128px
const NUMBER_RADIUS = 100; // Radius for positioning numbers on the clock face

// Clock numbers
const HOUR_VALUES = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_VALUES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({ onConfirm, onCancelTimer, open, setOpen }: TimePickerProps) {
  const currently = new Date();
  const [hour, setHour] = useState(() => {
    const currentHour = getHours(currently);
    return currentHour % 12 || 12;
  });
  const [minute, setMinute] = useState(() => getMinutes(currently));
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => (getHours(currently) >= 12 ? 'PM' : 'AM'));
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  // Update time based on angle
  const updateTimeByAngle = useCallback((angle: number) => {
    if (mode === 'hour') {
      const newHour = Math.round(angle / 30) || 12;
      setHour(newHour);
    } else {
      const newMinute = Math.round(angle / 6) % 60;
      setMinute(newMinute);
    }
  }, [mode]);

  // Calculate angle from coordinates
  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!clockRef.current) return null;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    const distance = Math.hypot(x, y);
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    return { angle, distance, x, y };
  }, []);

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, ignoreBoundary = false) => {
    // Get coordinates from mouse or touch event
    let clientX: number;
    let clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const result = calculateAngle(clientX, clientY);
    if (!result) return;

    const { angle, distance } = result;

    // Check if click is within the circle (skip boundary check when dragging)
    if (!ignoreBoundary && distance > CLOCK_RADIUS) return;

    updateTimeByAngle(angle);
  };

  const handleStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleClockClick(e);
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (mode === 'hour')
      setMode('minute');
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleClockClick(e, true); // Pass true to ignore boundary check when dragging
  };

  useEffect(() => {
    const handleGlobalEnd = () => setIsDragging(false);

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !clockRef.current) return;

      let clientX: number;
      let clientY: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const result = calculateAngle(clientX, clientY);
      if (!result) return;

      updateTimeByAngle(result.angle);
    };

    const handleGlobalMoveListener = handleGlobalMove;

    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMoveListener, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMoveListener);
    };
  }, [isDragging, mode, updateTimeByAngle, calculateAngle]);

  const getClockHandPosition = () => {
    const value = mode === 'hour' ? hour : minute;
    const angle = mode === 'hour' ? (value % 12) * 30 - 90 : value * 6 - 90;
    return {
      x: Math.cos((angle * Math.PI) / 180) * NUMBER_RADIUS,
      y: Math.sin((angle * Math.PI) / 180) * NUMBER_RADIUS
    };
  };

  const position = getClockHandPosition();

  const addTime = (hours: number, minutes: number) => {
    // 创建一个临时日期对象用于计算
    let tempDate = new Date();
    tempDate = setHours(tempDate, period === 'PM' ? (hour % 12) + 12 : hour % 12);
    tempDate = setMinutes(tempDate, minute);

    // 添加小时和分钟
    tempDate = addHours(tempDate, hours);
    tempDate = addMinutes(tempDate, minutes);

    // 提取新的小时和分钟
    const newHour24 = getHours(tempDate);
    const newMinute = getMinutes(tempDate);
    const newPeriod = newHour24 >= 12 ? 'PM' : 'AM';
    const newHour12 = newHour24 % 12 || 12;

    setHour(newHour12);
    setMinute(newMinute);
    setPeriod(newPeriod);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={e => {
          const timer = requestAnimationFrame(() => e?.focus({ preventScroll: true }));
          return () => cancelAnimationFrame(timer);
        }}
        className="p-2 w-80"
        showCloseButton={false}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <DialogTitle className="sr-only">选择时间</DialogTitle>
        <DialogDescription className="sr-only">
          选择一个时间以设置睡眠模式的停止播放时间
        </DialogDescription>
        <div className="w-full mx-auto rounded-sm overflow-hidden select-none">
          {/* Header */}
          <div className="bg-[#1976D2] py-4 relative">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setMode('hour')}
                className={cn('text-3xl font-light transition-opacity', mode === 'hour' ? 'text-white' : 'text-white/60')}
              >
                {hour.toString().padStart(2, '0')}
              </button>
              <span className="text-3xl font-light text-white">:</span>
              <button
                type="button"
                onClick={() => setMode('minute')}
                className={cn('text-3xl font-light transition-opacity', mode === 'minute' ? 'text-white' : 'text-white/60')}
              >
                {minute.toString().padStart(2, '0')}
              </button>
              <div className="ml-4 flex flex-col">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={cn('text-lg font-medium transition-opacity', period === 'AM' ? 'text-white' : 'text-white/60')}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  className={cn('text-lg font-medium transition-opacity', period === 'PM' ? 'text-white' : 'text-white/60')}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Clock */}
          <div className="relative">
            <button
              type="button"
              className="absolute top-4 right-4 p-2 bg-blue-500 rounded-full z-30"
              onClick={() => {
                const now = new Date();
                const currentHour24 = getHours(now);
                const currentMinute = getMinutes(now);
                const currentPeriod = currentHour24 >= 12 ? 'PM' : 'AM';
                const currentHour12 = currentHour24 % 12 || 12;

                setHour(currentHour12);
                setMinute(currentMinute);
                setPeriod(currentPeriod);
              }}
            >
              <Clock className="size-4 text-white" />
            </button>

            <motion.div
              ref={clockRef}
              className="relative h-80 w-full mx-auto flex items-center justify-center touch-none"
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              key={mode}
              exit={{ scale: 0.5 }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
            >
              {/* Gray circular background */}
              <div
                className="absolute size-64 rounded-full bg-accent dark:bg-accent/40 cursor-pointer"
                onClick={handleClockClick}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
              />

              {/* Clock numbers */}
              {mode === 'hour' ? (
                <>
                  {HOUR_VALUES.map((num, i) => {
                    const angle = i * 30 - 90;
                    const x = Math.cos((angle * Math.PI) / 180) * NUMBER_RADIUS;
                    const y = Math.sin((angle * Math.PI) / 180) * NUMBER_RADIUS;
                    return (
                      <div
                        key={num}
                        className={cn(
                          'absolute text-xs font-normal z-10 pointer-events-none',
                          hour === num ? 'text-white' : 'text-foreground'
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {num}
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {MINUTE_VALUES.map((num, i) => {
                    const angle = i * 30 - 90;
                    const x = Math.cos((angle * Math.PI) / 180) * NUMBER_RADIUS;
                    const y = Math.sin((angle * Math.PI) / 180) * NUMBER_RADIUS;
                    return (
                      <div
                        key={num}
                        className={cn(
                          'absolute text-xs font-normal z-10 pointer-events-none',
                          minute === num ? 'text-white' : 'text-foreground'
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {num.toString().padStart(2, '0')}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Clock hand */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="240" height="240" className="absolute -left-[120px] -top-[120px]">
                  <line x1="120" y1="120" x2={120 + position.x} y2={120 + position.y} stroke="#1976D2" strokeWidth="2" />
                  <circle cx="120" cy="120" r="4" fill="#1976D2" />
                  <circle cx={120 + position.x} cy={120 + position.y} r="4" fill="#1976D2" />
                </svg>
              </div>

              {/* Selected hour/minute indicator */}
              <Activity mode={(mode === 'hour' || MINUTE_VALUES.includes(minute)) ? 'visible' : 'hidden'}>
                <div
                  className="absolute size-8 rounded-full bg-[#1976D2] pointer-events-none"
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </Activity>
            </motion.div>

            {/* Quick actions */}
            <div className="flex gap-3 justify-center p-1">
              <Button
                onClick={() => addTime(1, 0)}
                variant="secondary"
                size="sm"
              >
                +1 HR
              </Button>
              <Button
                onClick={() => addTime(0, 30)}
                variant="secondary"
                size="sm"
              >
                +30 MIN
              </Button>
              <Button
                onClick={() => addTime(0, 10)}
                variant="secondary"
                size="sm"
              >
                +10 MIN
              </Button>
            </div>

          </div>
        </div>
        <div className="flex justify-between mx-2 mb-2">
          <Button
            onClick={() => {
              onCancelTimer();
              setOpen(false);
            }}
            size="sm"
            variant="ghost"
          >
            取消定时
          </Button>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setOpen(false);
              }}
              size="sm"
              variant="ghost"
            >
              取消
            </Button>
            <Button
              onClick={() => {
                let now = new Date();

                const selectedHour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;

                now = setHours(now, selectedHour24);
                now = setMinutes(now, minute);
                now = setSeconds(now, 0);
                now = setMilliseconds(now, 0);

                onConfirm(now.getTime());
                setOpen(false);
              }}
              size="sm"
              variant="ghost"
            >
              确定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
