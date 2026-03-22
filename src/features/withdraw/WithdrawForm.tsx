"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import { useConnection, useReadContract, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { metaMorphoVaultAbi } from "@/shared/abi";
import { VAULT_ADDRESS } from "@/shared/config";
import { useTranslation } from "react-i18next";

interface WithdrawFormProps {
  assetDecimals: number;
  assetSymbol: string;
  maxWithdrawable: bigint;
  vaultBalance?: bigint;
  positionAssets?: bigint;
}

export function WithdrawForm({
  assetDecimals,
  assetSymbol,
  maxWithdrawable,
  vaultBalance,
  positionAssets,
}: WithdrawFormProps) {
  const { t } = useTranslation("withdraw");
  const { address } = useConnection();
  const [callsId, setCallsId] = useState<string | undefined>();
  const [isMaxSelected, setIsMaxSelected] = useState(false);
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const queryClient = useQueryClient();

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .min(1, t("validation.required"))
          .regex(/^\d+\.?\d*$/, t("validation.invalidFormat"))
          .refine(
            (val) => {
              try {
                return parseUnits(val, assetDecimals) > BigInt(0);
              } catch {
                return false;
              }
            },
            { message: t("validation.positive") },
          )
          .refine(
            (val) => {
              try {
                return parseUnits(val, assetDecimals) <= maxWithdrawable;
              } catch {
                return false;
              }
            },
            { message: t("validation.exceedsMax") },
          ),
      }),
    [assetDecimals, maxWithdrawable, t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
    mode: "onChange",
  });

  const watchedAmount = useWatch({ control, name: "amount" });

  const parsedAmount = useMemo(() => {
    try {
      return watchedAmount ? parseUnits(watchedAmount, assetDecimals) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [watchedAmount, assetDecimals]);

  const { data: sharesToRedeem } = useReadContract({
    address: VAULT_ADDRESS,
    abi: metaMorphoVaultAbi,
    functionName: "convertToShares",
    args: [parsedAmount],
    query: { enabled: parsedAmount > BigInt(0) && !isMaxSelected },
  });

  const { mutate, isPending } = useSendCalls({
    mutation: {
      onSuccess: (result) => {
        setCallsId(result.id);
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = toast.loading(t("confirming"));
      },
      onError: (error: Error) => {
        toast.dismiss(toastIdRef.current);
        toast.error(t("failed", { error: error.message }));
      },
    },
  });

  const { data: callsStatus } = useCallsStatus({
    id: callsId ?? "",
    query: {
      enabled: !!callsId,
      refetchInterval: 2000,
    },
  });

  useEffect(() => {
    if (!callsStatus || !callsId) return;

    const status = callsStatus.status;

    if (status === "success") {
      toast.dismiss(toastIdRef.current);
      toast.success(t("success"));
      setCallsId(undefined);
      setIsMaxSelected(false);
      reset();
      queryClient.invalidateQueries();
    } else if (status === "failure") {
      toast.dismiss(toastIdRef.current);
      toast.error(t("failed", { error: t("errorReverted", { ns: "transaction" }) }));
      setCallsId(undefined);
    }
  }, [callsStatus, callsId, t, reset, queryClient]);

  function onSubmit() {
    if (!address) return;

    // When max is selected, redeem the full share balance to avoid
    // rounding errors from the assets→shares conversion
    const shares = isMaxSelected && vaultBalance
      ? vaultBalance
      : sharesToRedeem;

    if (!shares) return;

    toastIdRef.current = toast.loading(t("submitted"));
    mutate({
      calls: [
        {
          to: VAULT_ADDRESS,
          abi: metaMorphoVaultAbi,
          functionName: "redeem",
          args: [shares as bigint, address, address],
        },
      ],
      experimental_fallback: true,
    });
  }

  function handleMax() {
    if (maxWithdrawable > BigInt(0)) {
      setIsMaxSelected(true);
      setValue("amount", formatUnits(maxWithdrawable, assetDecimals), {
        shouldValidate: true,
      });
    }
  }

  const { onChange: registerOnChange, ...restRegister } = register("amount");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {vaultBalance !== undefined && vaultBalance > BigInt(0) && (
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p className="text-sm text-muted-foreground">{t("yourPosition")}</p>
          <p className="text-sm font-medium">
            {positionAssets !== undefined
              ? `${formatUnits(positionAssets, assetDecimals)} ${assetSymbol}`
              : `${formatUnits(vaultBalance, assetDecimals)} ${t("sharesLabel")}`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="withdraw-amount">{t("amountLabel", { symbol: assetSymbol })}</Label>
        <div className="relative">
          <Input
            id="withdraw-amount"
            type="text"
            inputMode="decimal"
            placeholder={t("placeholder")}
            aria-invalid={!!errors.amount}
            className="h-11 pr-16 text-base"
            {...restRegister}
            onChange={(e) => {
              setIsMaxSelected(false);
              registerOnChange(e);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs font-semibold text-primary hover:text-primary"
            onClick={handleMax}
          >
            {t("maxBtn")}
          </Button>
        </div>
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          !address ||
          isPending ||
          !!callsId ||
          (parsedAmount > BigInt(0) && !isMaxSelected && !sharesToRedeem)
        }
      >
        {isPending
          ? t("btnSubmitting")
          : callsId
            ? t("btnConfirming")
            : t("btnWithdraw")}
      </Button>
    </form>
  );
}
