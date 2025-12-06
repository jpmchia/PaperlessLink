"use client";

import React, { useState } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherCalendar } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherChevronLeft } from "@subframe/core";
import { FeatherChevronRight } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

interface DateRangePickerProps {
  value?: { start: Date | null; end: Date | null };
  onChange?: (range: { start: Date | null; end: Date | null }) => void;
  label?: string;
  className?: string;
}

export function DateRangePicker({ value, onChange, label, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(value?.start || null);
  const [tempEnd, setTempEnd] = useState<Date | null>(value?.end || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next;
  });

  const formatDateRange = () => {
    const fieldLabel = label || "Date range";
    if (!tempStart && !tempEnd) return fieldLabel;
    if (tempStart && !tempEnd) {
      return tempStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (tempStart && tempEnd) {
      return `${tempStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })} - ${tempEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return fieldLabel;
  };

  const handleDateClick = (date: Date, isFirst: boolean) => {
    if (isFirst) {
      // Left calendar - set start date
      setTempStart(date);
      // If end date is set and new start is after end, clear end
      if (tempEnd && date > tempEnd) {
        setTempEnd(null);
      }
    } else {
      // Right calendar - set end date
      if (!tempStart) {
        // If no start date, set it first
        setTempStart(date);
        setTempEnd(null);
      } else {
        // Set end date
        if (date < tempStart) {
          // If clicked date is before start, swap them
          setTempEnd(tempStart);
          setTempStart(date);
        } else {
          setTempEnd(date);
        }
      }
    }
  };

  const handleApply = () => {
    if (onChange) {
      onChange({ start: tempStart, end: tempEnd });
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStart(value?.start || null);
    setTempEnd(value?.end || null);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
  };

  const isDateInRange = (date: Date) => {
    if (!tempStart) return false;
    if (tempStart && !tempEnd) {
      return date.getTime() === tempStart.getTime();
    }
    if (tempStart && tempEnd) {
      return date >= tempStart && date <= tempEnd;
    }
    return false;
  };

  const isDateStart = (date: Date) => {
    return tempStart && date.getTime() === tempStart.getTime();
  };

  const isDateEnd = (date: Date) => {
    return tempEnd && date.getTime() === tempEnd.getTime();
  };

  const isDateInMiddle = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    return date > tempStart && date < tempEnd;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0); // Last day of previous month
    const daysInPrevMonth = prevMonthLastDay.getDate();
    
    // Add days from previous month (startingDayOfWeek tells us how many we need)
    // Example: If startingDayOfWeek is 3 (Wednesday), we need Mon(30), Tue(31), Wed(1)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNumber = daysInPrevMonth - startingDayOfWeek + i + 1;
      const prevDate = new Date(year, month - 1, dayNumber);
      days.push(prevDate);
    }
    
    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Fill remaining cells to complete exactly 6 weeks (42 cells total)
    const totalDaysSoFar = days.length;
    const remainingCells = 42 - totalDaysSoFar;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push(nextDate);
    }
    
    // Ensure we always return exactly 42 days (6 weeks)
    if (days.length !== 42) {
      console.warn(`Calendar days array has ${days.length} items, expected 42`);
      return days.slice(0, 42);
    }
    
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long' });
  };

  const getYear = (date: Date) => {
    return date.getFullYear();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    // Generate years from 10 years ago to 10 years in the future
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const navigateMonth = (direction: 'prev' | 'next', isFirst: boolean) => {
    const targetDate = isFirst ? currentMonth : nextMonth;
    const newDate = new Date(targetDate);
    
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    if (isFirst) {
      setCurrentMonth(newDate);
      // Update next month to be one month after
      const newNext = new Date(newDate);
      newNext.setMonth(newNext.getMonth() + 1);
      setNextMonth(newNext);
    } else {
      setNextMonth(newDate);
    }
  };

  const handleMonthChange = (monthIndex: number, isFirst: boolean) => {
    const targetDate = isFirst ? currentMonth : nextMonth;
    const newDate = new Date(targetDate);
    newDate.setMonth(monthIndex);
    
    if (isFirst) {
      setCurrentMonth(newDate);
      // Update next month to be one month after
      const newNext = new Date(newDate);
      newNext.setMonth(newNext.getMonth() + 1);
      setNextMonth(newNext);
    } else {
      setNextMonth(newDate);
    }
  };

  const handleYearChange = (year: number, isFirst: boolean) => {
    const targetDate = isFirst ? currentMonth : nextMonth;
    const newDate = new Date(targetDate);
    newDate.setFullYear(year);
    
    if (isFirst) {
      setCurrentMonth(newDate);
      // Update next month to be one month after
      const newNext = new Date(newDate);
      newNext.setMonth(newNext.getMonth() + 1);
      setNextMonth(newNext);
    } else {
      setNextMonth(newDate);
    }
  };

  const handleTodayClick = (isFirst: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(today);
    
    // Navigate to today's month
    if (isFirst) {
      setCurrentMonth(newDate);
      const newNext = new Date(newDate);
      newNext.setMonth(newNext.getMonth() + 1);
      setNextMonth(newNext);
    } else {
      setNextMonth(newDate);
    }
    
    // Select today's date
    handleDateClick(today, isFirst);
  };

  const renderCalendar = (date: Date, isFirst: boolean) => {
    const days = getDaysInMonth(date);
    const monthYear = formatMonthYear(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthIndex = date.getMonth();
    const currentYear = date.getFullYear();
    const isCurrentMonth = today.getMonth() === currentMonthIndex && today.getFullYear() === currentYear;

    return (
      <div className="flex min-w-[288px] flex-col items-start gap-3">
        {/* Heading with Month/Year Dropdowns */}
        <div className="flex w-full items-center gap-2">
          <span className="text-body-bold font-body-bold text-default-font flex-none">
            {isFirst ? "From" : "To"}
          </span>
          
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                size="small"
                iconRight={<FeatherChevronDown />}
                className="w-[10em]"
              >
                {months[currentMonthIndex]}
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  {months.map((month, index) => (
                    <DropdownMenu.DropdownItem
                      key={month}
                      icon={null}
                      onClick={() => handleMonthChange(index, isFirst)}
                    >
                      {month}
                    </DropdownMenu.DropdownItem>
                  ))}
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>

          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                size="small"
                iconRight={<FeatherChevronDown />}
              >
                {currentYear}
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  {getYears().map((year) => (
                    <DropdownMenu.DropdownItem
                      key={year}
                      icon={null}
                      onClick={() => handleYearChange(year, isFirst)}
                    >
                      {year.toString()}
                    </DropdownMenu.DropdownItem>
                  ))}
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
        </div>
        
        {/* Navigation with Today button */}
        <div className="flex w-full items-center justify-between">
          <IconButton
            size="small"
            icon={<FeatherChevronLeft />}
            onClick={() => navigateMonth('prev', isFirst)}
          />
          <Button
            variant="neutral-secondary"
            size="small"
            onClick={() => handleTodayClick(isFirst)}
          >
            Today
          </Button>
          <IconButton
            size="small"
            icon={<FeatherChevronRight />}
            onClick={() => navigateMonth('next', isFirst)}
          />
        </div>
        <div className="flex w-full flex-col items-start gap-1">
          {/* Day headers */}
          <div className="flex w-full items-center gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="flex h-8 w-8 flex-none items-center justify-center">
                <span className="text-caption font-caption text-subtext-color">
                  {day}
                </span>
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          {Array.from({ length: 6 }).map((_, weekIndex) => {
            const weekStart = weekIndex * 7;
            const weekEnd = weekStart + 7;
            const weekDays = days.slice(weekStart, weekEnd);
            
            return (
              <div key={weekIndex} className="flex w-full items-center gap-1">
                {weekDays.map((day, dayIndex) => {
                  const dayDate = new Date(day);
                  dayDate.setHours(0, 0, 0, 0);
                  
                  // Check if this day belongs to the current month being displayed
                  const isCurrentMonth = day.getMonth() === date.getMonth();
                  
                  const isStart = isDateStart(dayDate);
                  const isEnd = isDateEnd(dayDate);
                  const inMiddle = isDateInMiddle(dayDate);

                  let bgClass = isCurrentMonth ? "bg-neutral-100" : "";
                  let textClass = isCurrentMonth 
                    ? "text-body font-body text-subtext-color" 
                    : "text-body font-body text-neutral-400";
                  
                  if (isStart || isEnd) {
                    bgClass = "bg-brand-primary";
                    textClass = "text-body-bold font-body-bold text-default-background";
                  } else if (inMiddle) {
                    bgClass = "bg-brand-primary bg-opacity-20";
                    textClass = "text-body font-body text-default-font";
                  }

                  return (
                    <div
                      key={`${day.getTime()}-${weekIndex}-${dayIndex}`}
                      className={`flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-brand-100 ${bgClass}`}
                      onClick={() => handleDateClick(dayDate, isFirst)}
                    >
                      <span className={textClass}>
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SubframeCore.DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant="neutral-secondary"
          icon={<FeatherCalendar />}
          iconRight={<FeatherChevronDown />}
          className={className}
        >
          {formatDateRange()}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
          style={{ zIndex: 10000 }}
        >
          <div className="flex flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-4 shadow-lg z-[10000]">
            <div className="flex w-full items-center gap-6">
              {renderCalendar(currentMonth, true)}
              {renderCalendar(nextMonth, false)}
            </div>
            <div className="flex w-full items-center justify-between gap-2 border-t border-solid border-neutral-border pt-4">
              {/* Date Range Display */}
              <div className="flex items-center gap-2">
                <span className="text-body font-body text-default-font">
                  {tempStart 
                    ? tempStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select start date'}
                </span>
                <span className="text-body font-body text-subtext-color">-</span>
                <span className="text-body font-body text-default-font">
                  {tempEnd 
                    ? tempEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select end date'}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="neutral-secondary"
                  size="small"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  onClick={handleClear}
                >
                  Clear Filter
                </Button>
                <Button
                  variant="brand-primary"
                  size="small"
                  onClick={handleApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

