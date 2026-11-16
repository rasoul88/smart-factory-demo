import { useState } from "react";

import { Loader2, Power, PowerOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@components/ui/button";
import { Slider } from "@components/ui/slider";

import { ECommandAction } from "@dto/command.dto";
import type {
  IConveyorState,
  IHeaterState,
  ILightState,
  IMotorState,
  IPumpState,
  IValveState,
  TEquipmentState,
} from "@dto/equipment.dto";

import { cn } from "@utils/cn";
import { formatNumber } from "@utils/format/format";

export interface IControlProps<TState extends TEquipmentState> {
  state: TState;
  disabled: boolean;
  isPending: boolean;
  onCommand: (action: ECommandAction, value?: number) => void;
}

interface ISliderCommand {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  action: ECommandAction;
  disabled: boolean;
  isPending: boolean;
  onCommand: (action: ECommandAction, value?: number) => void;
}

const SliderCommand = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  action,
  disabled,
  isPending,
  onCommand,
}: ISliderCommand) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);

  const current = dirty ? draft : value;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/60 bg-secondary/25 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="num text-xs font-semibold text-foreground">
          {formatNumber(current)} {unit}
        </span>
      </div>

      <Slider
        value={[current]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => {
          setDraft(next);
          setDirty(true);
        }}
        onValueCommit={([next]) => {
          onCommand(action, next);
          setDirty(false);
        }}
      />

      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span className="num">
          {formatNumber(min)}
          <span className="mx-0.5">{unit}</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || isPending || current === value}
          onClick={() => onCommand(action, current)}
        >
          {isPending && (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          )}
          {isPending ? t("control-sending") : t("control-apply")}
        </Button>
        <span className="num">
          {formatNumber(max)}
          <span className="mx-0.5">{unit}</span>
        </span>
      </div>
    </div>
  );
};

const ToggleRow = ({
  active,
  disabled,
  isPending,
  onOn,
  onOff,
  onLabel,
  offLabel,
}: {
  active: boolean;
  disabled: boolean;
  isPending: boolean;
  onOn: () => void;
  onOff: () => void;
  onLabel: string;
  offLabel: string;
}) => (
  <div className="grid grid-cols-2 gap-2">
    <Button
      variant={active ? "default" : "outline"}
      disabled={disabled || isPending || active}
      onClick={onOn}
      className={cn(!active && "border-status-running/30 text-status-running")}
    >
      {isPending && active && (
        <Loader2 className="animate-spin" data-icon="inline-start" />
      )}
      <Power data-icon={isPending ? undefined : "inline-start"} />
      {onLabel}
    </Button>
    <Button
      variant={active ? "outline" : "secondary"}
      disabled={disabled || isPending || !active}
      onClick={onOff}
      className={cn(active && "border-status-fault/30 text-status-fault")}
    >
      <PowerOff data-icon="inline-start" />
      {offLabel}
    </Button>
  </div>
);

export const MotorControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<IMotorState>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleRow
        active={state.running}
        disabled={disabled}
        isPending={isPending}
        onOn={() => onCommand(ECommandAction.Start)}
        onOff={() => onCommand(ECommandAction.Stop)}
        onLabel={t("control-start")}
        offLabel={t("control-stop")}
      />
      <SliderCommand
        label={t("control-speed")}
        value={state.speedPercent}
        min={0}
        max={100}
        step={5}
        unit="٪"
        action={ECommandAction.SetSpeed}
        disabled={disabled}
        isPending={isPending}
        onCommand={onCommand}
      />
    </div>
  );
};

export const PumpControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<IPumpState>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleRow
        active={state.running}
        disabled={disabled}
        isPending={isPending}
        onOn={() => onCommand(ECommandAction.Start)}
        onOff={() => onCommand(ECommandAction.Stop)}
        onLabel={t("control-start")}
        offLabel={t("control-stop")}
      />
      <SliderCommand
        label={t("control-speed")}
        value={state.speedPercent}
        min={0}
        max={100}
        step={5}
        unit="٪"
        action={ECommandAction.SetSpeed}
        disabled={disabled}
        isPending={isPending}
        onCommand={onCommand}
      />
    </div>
  );
};

export const ValveControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<IValveState>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleRow
        active={state.open}
        disabled={disabled}
        isPending={isPending}
        onOn={() => onCommand(ECommandAction.Open)}
        onOff={() => onCommand(ECommandAction.Close)}
        onLabel={t("control-open")}
        offLabel={t("control-close")}
      />
      <SliderCommand
        label={t("control-position")}
        value={state.positionPercent}
        min={0}
        max={100}
        step={5}
        unit="٪"
        action={ECommandAction.SetPosition}
        disabled={disabled}
        isPending={isPending}
        onCommand={onCommand}
      />
    </div>
  );
};

export const HeaterControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<IHeaterState>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleRow
        active={state.on}
        disabled={disabled}
        isPending={isPending}
        onOn={() => onCommand(ECommandAction.TurnOn)}
        onOff={() => onCommand(ECommandAction.TurnOff)}
        onLabel={t("control-turn-on")}
        offLabel={t("control-turn-off")}
      />
      <SliderCommand
        label={t("control-temperature")}
        value={state.targetTempC}
        min={40}
        max={1200}
        step={10}
        unit="°C"
        action={ECommandAction.SetTemperature}
        disabled={disabled}
        isPending={isPending}
        onCommand={onCommand}
      />
    </div>
  );
};

export const LightControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<ILightState>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2.5">
      <ToggleRow
        active={state.on}
        disabled={disabled}
        isPending={isPending}
        onOn={() => onCommand(ECommandAction.TurnOn)}
        onOff={() => onCommand(ECommandAction.TurnOff)}
        onLabel={t("control-turn-on")}
        offLabel={t("control-turn-off")}
      />
      <SliderCommand
        label={t("control-brightness")}
        value={state.brightness}
        min={0}
        max={100}
        step={5}
        unit="٪"
        action={ECommandAction.SetBrightness}
        disabled={disabled}
        isPending={isPending}
        onCommand={onCommand}
      />
    </div>
  );
};

export const ConveyorControls = ({
  state,
  disabled,
  isPending,
  onCommand,
}: IControlProps<IConveyorState>) => {
  const { t } = useTranslation();

  return (
    <ToggleRow
      active={state.running}
      disabled={disabled}
      isPending={isPending}
      onOn={() => onCommand(ECommandAction.Start)}
      onOff={() => onCommand(ECommandAction.Stop)}
      onLabel={t("control-start")}
      offLabel={t("control-stop")}
    />
  );
};
