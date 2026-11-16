import { useState } from "react";

import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Slider } from "@components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";

import type { ECommandAction } from "@dto/command.dto";
import type { TEquipmentDefinition } from "@dto/equipment.dto";
import { EScheduleMode, EWeekday } from "@dto/schedule.dto";
import type { IScheduleDraft } from "@dto/schedule.dto";

import { cn } from "@utils/cn";
import { formatNumber } from "@utils/format/format";
import { scheduleActionsForKind } from "@utils/schedule/schedule-actions";
import { WEEK_ORDER, atTimeOfDay } from "@utils/schedule/schedule-math";

interface IScheduleForm {
  definition: TEquipmentDefinition;
  initial?: Partial<IScheduleDraft>;
  submitLabelKey: string;
  onSubmit: (draft: IScheduleDraft) => void;
  onCancel: () => void;
}

const DEFAULT_TIME = "05:00";

const nextDayRunAt = (timeOfDay: string, dayOffset: 0 | 1): number => {
  const base = new Date(Date.now() + dayOffset * 86_400_000);
  return atTimeOfDay(base, timeOfDay).getTime();
};

export const ScheduleForm = ({
  definition,
  initial,
  submitLabelKey,
  onSubmit,
  onCancel,
}: IScheduleForm) => {
  const { t } = useTranslation();
  const options = scheduleActionsForKind(definition);

  const initialAction = options.some((item) => item.action === initial?.action)
    ? (initial?.action as ECommandAction)
    : options[0].action;

  const [action, setAction] = useState<ECommandAction>(initialAction);
  const [mode, setMode] = useState<EScheduleMode>(
    initial?.mode ?? EScheduleMode.Daily,
  );
  const [timeOfDay, setTimeOfDay] = useState(initial?.timeOfDay ?? DEFAULT_TIME);
  const [days, setDays] = useState<EWeekday[]>(
    initial?.daysOfWeek ?? [EWeekday.Saturday],
  );
  const [dayOffset, setDayOffset] = useState<0 | 1>(0);
  const [error, setError] = useState("");

  const selectedOption = options.find((item) => item.action === action);
  const [value, setValue] = useState<number>(
    initial?.value ??
      (selectedOption?.valueRange
        ? Math.round(
            (selectedOption.valueRange.min + selectedOption.valueRange.max) / 2,
          )
        : 0),
  );

  const range = selectedOption?.valueRange;

  const handleSubmit = () => {
    setError("");

    if (mode === EScheduleMode.Weekly && days.length === 0) {
      setError(t("schedule-days-required"));
      return;
    }

    if (mode !== EScheduleMode.Once && !timeOfDay) {
      setError(t("schedule-time-required"));
      return;
    }

    onSubmit({
      equipmentId: definition.id,
      action,
      value: range ? value : undefined,
      mode,
      timeOfDay,
      daysOfWeek: mode === EScheduleMode.Weekly ? days : undefined,
      runAt:
        mode === EScheduleMode.Once
          ? nextDayRunAt(timeOfDay, dayOffset)
          : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="text-[11px] text-muted-foreground">
          {t("schedule-action")}
        </Label>
        <Select
          value={action}
          onValueChange={(next) => {
            const option = options.find((item) => item.action === next);
            setAction(next as ECommandAction);
            if (option?.valueRange) {
              setValue(
                Math.round((option.valueRange.min + option.valueRange.max) / 2),
              );
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.action} value={option.action}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {range && (
        <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-secondary/25 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">
              {t("schedule-value")}
            </Label>
            <span className="num text-xs font-semibold text-foreground">
              {formatNumber(value)} {range.unit}
            </span>
          </div>
          <Slider
            value={[value]}
            min={range.min}
            max={range.max}
            step={range.step}
            onValueChange={([next]) => setValue(next)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label className="text-[11px] text-muted-foreground">
          {t("schedule-repeat")}
        </Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(next) => next && setMode(next as EScheduleMode)}
          className="w-full"
        >
          <ToggleGroupItem value={EScheduleMode.Once} className="flex-1">
            {t("schedule-mode-once")}
          </ToggleGroupItem>
          <ToggleGroupItem value={EScheduleMode.Daily} className="flex-1">
            {t("schedule-mode-daily")}
          </ToggleGroupItem>
          <ToggleGroupItem value={EScheduleMode.Weekly} className="flex-1">
            {t("schedule-mode-weekly")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {mode === EScheduleMode.Once && (
        <div className="flex flex-col gap-2">
          <Label className="text-[11px] text-muted-foreground">
            {t("schedule-run-date")}
          </Label>
          <ToggleGroup
            type="single"
            value={String(dayOffset)}
            onValueChange={(next) => next && setDayOffset(Number(next) as 0 | 1)}
            className="w-full"
          >
            <ToggleGroupItem value="0" className="flex-1">
              {t("schedule-today")}
            </ToggleGroupItem>
            <ToggleGroupItem value="1" className="flex-1">
              {t("schedule-tomorrow")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="schedule-time"
          className="text-[11px] text-muted-foreground"
        >
          {t("schedule-time")}
        </Label>
        <Input
          id="schedule-time"
          type="time"
          value={timeOfDay}
          onChange={(event) => setTimeOfDay(event.target.value)}
          dir="ltr"
          className="num w-40 text-center"
        />
      </div>

      {mode === EScheduleMode.Weekly && (
        <div className="flex flex-col gap-2">
          <Label className="text-[11px] text-muted-foreground">
            {t("schedule-days")}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEK_ORDER.map((day) => {
              const active = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setDays((current) =>
                      current.includes(day)
                        ? current.filter((item) => item !== day)
                        : [...current, day],
                    )
                  }
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
                    active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {t(`weekday-${day}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          {t("schedule-cancel")}
        </Button>
        <Button onClick={handleSubmit}>{t(submitLabelKey)}</Button>
      </div>
    </div>
  );
};
