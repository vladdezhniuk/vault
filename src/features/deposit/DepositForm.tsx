"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useConnection, useSendCalls, useCallsStatus } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { erc20Abi, metaMorphoVaultAbi } from "@/shared/abi";
import { VAULT_ADDRESS } from "@/shared/config";
import { useTranslation } from "react-i18next";

interface DepositFormProps {
  assetAddress: Address;
  assetDecimals: number;
  assetSymbol: string;
  userAssetBalance: bigint;
  allowance?: bigint;
}

export function DepositForm({
  assetAddress,
  assetDecimals,
  assetSymbol,
  userAssetBalance,
  allowance,
}: DepositFormProps) {
  const { t } = useTranslation("deposit");
  const { address } = useConnection();
  const [callsId, setCallsId] = useState<string | undefined>();
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
                return parseUnits(val, assetDecimals) <= userAssetBalance;
              } catch {
                return false;
              }
            },
            { message: t("validation.insufficientBalance") },
          ),
      }),
    [assetDecimals, userAssetBalance, t],
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

  const needsApprovalForDisplay =
    allowance !== undefined && parsedAmount > BigInt(0) && allowance < parsedAmount;

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
      reset();
      queryClient.invalidateQueries();
    } else if (status === "failure") {
      toast.dismiss(toastIdRef.current);
      toast.error(t("failed", { error: t("errorReverted", { ns: "transaction" }) }));
      setCallsId(undefined);
    }
  }, [callsStatus, callsId, t, reset, queryClient]);

  function onSubmit(data: FormValues) {
    if (!address) return;

    const parsed = parseUnits(data.amount, assetDecimals);
    const needsApproval =
      allowance !== undefined && parsed > BigInt(0) && allowance < parsed;

    const calls: Array<{
      to: Address;
      abi: typeof erc20Abi | typeof metaMorphoVaultAbi;
      functionName: string;
      args: readonly unknown[];
    }> = [];

    if (needsApproval) {
      calls.push({
        to: assetAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS, parsed],
      });
    }

    calls.push({
      to: VAULT_ADDRESS,
      abi: metaMorphoVaultAbi,
      functionName: "deposit",
      args: [parsed, address],
    });

    toastIdRef.current = toast.loading(t("submitted"));
    mutate({ calls, experimental_fallback: true });
  }

  function handleMax() {
    if (userAssetBalance > BigInt(0)) {
      setValue("amount", formatUnits(userAssetBalance, assetDecimals), {
        shouldValidate: true,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="deposit-amount">{t("amountLabel", { symbol: assetSymbol })}</Label>
        <div className="relative">
          <Input
            id="deposit-amount"
            type="text"
            inputMode="decimal"
            placeholder={t("placeholder")}
            aria-invalid={!!errors.amount}
            className="h-11 pr-16 text-base"
            {...register("amount")}
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
        disabled={!address || isPending || !!callsId}
      >
        {isPending
          ? t("btnSubmitting")
          : callsId
            ? t("btnConfirming")
            : needsApprovalForDisplay
              ? t("btnApproveDeposit")
              : t("btnDeposit")}
      </Button>
    </form>
  );
}
