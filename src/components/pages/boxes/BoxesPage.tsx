"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Box1, Edit2, Flag, MoneyRecive, MoneySend, TickCircle, Trash } from "iconsax-reactjs";

import * as boxesApi from "@/common/api/boxes";
import * as profileApi from "@/common/api/profile";
import type { IBox } from "@/common/interfaces/box.interface";
import { formatPrice, formatPriceInput, getJalaliNow, parsePriceInput } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { boxesSelector, setBoxes } from "@/stores/box";
import { setProfile, userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";

const QUICK_AMOUNTS = [1_000_000, 5_000_000, 10_000_000];
const BOX_TONES = ["#14b8a6", "#8b5cf6", "#f43f5e", "#f59e0b", "#3b82f6", "#22c55e"];

type MoveState = { box: IBox; direction: "in" | "out" } | null;

export function BoxesPage() {
  const { t } = useTranslation();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const { formatCount } = useLocalizedDate();
  const dispatch = useAppDispatch();
  const boxes = useAppSelector(boxesSelector);
  const user = useAppSelector(userSelector);
  const unit = displayCurrencyLabel(user?.preferences?.currency ?? "toman");
  const [loading, setLoading] = useState(true);

  const [editor, setEditor] = useState<{ open: boolean; box: IBox | null }>({ open: false, box: null });
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const [move, setMove] = useState<MoveState>(null);
  const [amount, setAmount] = useState("");
  const [moving, setMoving] = useState(false);

  const [removing, setRemoving] = useState<IBox | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  useEffect(() => {
    void boxesApi
      .fetchBoxes()
      .then((data) => dispatch(setBoxes(data)))
      .catch((error) => showErrorToast(error))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const total = useMemo(() => (boxes ?? []).reduce((sum, box) => sum + box.budget, 0), [boxes]);
  const goalsDone = useMemo(
    () => (boxes ?? []).filter((box) => box.goal && box.budget >= box.goal).length,
    [boxes],
  );

  /** Box moves change the wallet too, so refresh both. */
  async function refresh() {
    const [list, profile] = await Promise.all([boxesApi.fetchBoxes(), profileApi.fetchProfile().catch(() => null)]);
    dispatch(setBoxes(list));
    if (profile) dispatch(setProfile(profile));
  }

  function openEditor(box: IBox | null) {
    setTitle(box?.title ?? "");
    setGoal(box?.goal ? String(box.goal) : "");
    setEditor({ open: true, box });
  }

  async function saveBox(event?: FormEvent) {
    event?.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), goal: goal ? parsePriceInput(goal, true) : "0" };
      if (editor.box) {
        const updated = await boxesApi.updateBox(editor.box._id, payload);
        dispatch(setBoxes((boxes ?? []).map((b) => (b._id === updated._id ? updated : b))));
        showToast(t("auto.kda7dcb4c8f"), "success");
      } else {
        const created = await boxesApi.createBox(payload);
        dispatch(setBoxes([...(boxes ?? []), created]));
        showToast(t("auto.k0d838a19f3"), "success");
      }
      setEditor({ open: false, box: null });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  async function submitMove(event?: FormEvent) {
    event?.preventDefault();
    if (!move || !amount) return;
    const value = Number(parsePriceInput(amount, true));
    if (!value || value <= 0) return;
    const now = getJalaliNow();
    setMoving(true);
    try {
      await boxesApi.changeBoxBudget(move.box._id, {
        price: String(move.direction === "in" ? value : -value),
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
      });
      await refresh();
      showToast(move.direction === "in" ? t("pages.boxes.deposited") : t("pages.boxes.withdrawn"), "success");
      setMove(null);
      setAmount("");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setMoving(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    const now = getJalaliNow();
    setRemoveBusy(true);
    try {
      await boxesApi.softDeleteBox(removing._id, {
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
      });
      await refresh();
      showToast(t("auto.ka99c0447ce"), "success");
      setRemoving(null);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeroSection
        variant="emerald"
        eyebrow={t("pages.boxes.eyebrow")}
        title={t("nav.boxes")}
        description={t("auto.k5bebefac7e")}
        aside={
          <Button className="bg-white/95 font-semibold text-emerald-700" onPress={() => openEditor(null)}>
            <Add size={18} />
            {t("auto.k284231b957")}
          </Button>
        }
        footer={
          boxes?.length ? (
            <div className="mt-5 grid grid-cols-2 gap-2 text-white sm:grid-cols-3">
              <div className="col-span-2 rounded-2xl bg-white/12 px-3 py-2.5 sm:col-span-1">
                <p className="text-[11px] text-white/75">{t("pages.boxes.totalSaved")}</p>
                <p className="mt-0.5 truncate text-base font-extrabold lg:text-xl">
                  <AnimatedNumber value={total} format={(n) => formatPrice(n)} />{" "}
                  <span className="text-[11px] font-medium text-white/75">{unit}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/12 px-3 py-2.5">
                <p className="text-[11px] text-white/75">{t("pages.boxes.count")}</p>
                <p className="mt-0.5 text-base font-extrabold lg:text-xl">{formatCount(boxes.length)}</p>
              </div>
              <div className="rounded-2xl bg-white/12 px-3 py-2.5">
                <p className="text-[11px] text-white/75">{t("pages.boxes.goalsReached")}</p>
                <p className="mt-0.5 text-base font-extrabold lg:text-xl">{formatCount(goalsDone)}</p>
              </div>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-48 rounded-3xl" />
          ))}
        </div>
      ) : !boxes?.length ? (
        <div className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Box1 size={30} variant="Bulk" />
          </span>
          <p className="font-bold">{t("auto.kf7e10d20cb")}</p>
          <p className="mt-1 max-w-sm text-sm leading-7 text-muted">{t("pages.boxes.emptyHint")}</p>
          <Button className="mt-5" onPress={() => openEditor(null)}>
            <Add size={18} />
            {t("auto.k284231b957")}
          </Button>
        </div>
      ) : (
        <div className="pb-card-grid !gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boxes.map((box, index) => {
            const tone = BOX_TONES[index % BOX_TONES.length];
            const progress = box.goal ? Math.min(100, (box.budget / box.goal) * 100) : null;
            const reached = progress !== null && progress >= 100;
            return (
              <article key={box._id} className="pb-box pb-lift" style={{ ["--tone" as string]: tone }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="pb-box-icon">
                      {reached ? <TickCircle size={22} variant="Bold" /> : <Box1 size={22} variant="Bulk" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{box.title}</h3>
                      <p className="text-xs text-muted">
                        {box.goal ? t("pages.boxes.goalOf", { amount: `${formatPrice(box.goal)} ${unit}` }) : t("pages.boxes.noGoal")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button type="button" className="pb-icon-btn" aria-label={t("common.edit")} onClick={() => openEditor(box)}>
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="pb-icon-btn hover:!text-danger"
                      aria-label={t("common.delete")}
                      onClick={() => setRemoving(box)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <AnimatedNumber
                    value={box.budget}
                    format={(n) => formatPrice(n)}
                    className="text-2xl font-extrabold tracking-tight lg:text-[1.75rem]"
                  />
                  <span className="text-xs text-muted">{unit}</span>
                </p>

                {progress !== null ? (
                  <div className="mt-3">
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary">
                      <div className="pb-meter-fill h-full rounded-full" style={{ width: `${Math.max(progress, 3)}%`, background: tone }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                      <span className="font-semibold" style={{ color: tone }}>
                        {formatCount(Math.floor(progress))}٪
                      </span>
                      <span>
                        {reached
                          ? t("pages.boxes.reached")
                          : t("pages.boxes.remaining", { amount: `${formatPrice(box.goal - box.budget)} ${unit}` })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEditor(box)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    <Flag size={14} />
                    {t("pages.boxes.setGoal")}
                  </button>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button size="sm" className="pb-press" onPress={() => setMove({ box, direction: "in" })}>
                    <MoneyRecive size={16} />
                    {t("pages.boxes.deposit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="pb-press"
                    isDisabled={box.budget <= 0}
                    onPress={() => setMove({ box, direction: "out" })}
                  >
                    <MoneySend size={16} />
                    {t("pages.boxes.withdraw")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* create / edit */}
      <AppModal open={editor.open} onOpenChange={(open) => setEditor((s) => ({ ...s, open }))}>
        <AppModalDialog>
          <form onSubmit={(e) => void saveBox(e)}>
            <AppModalHeader onClose={() => setEditor({ open: false, box: null })}>
              <Modal.Heading>{editor.box ? t("auto.k88476a18ed") : t("auto.k284231b957")}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body className="space-y-4">
              <FormInput label={t("auto.k401698bc19")} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              <FormInput
                label={t("pages.boxes.goalLabel", { unit })}
                value={formatPriceInput(goal, true)}
                onChange={(e) => setGoal(parsePriceInput(e.target.value, true))}
                inputMode="numeric"
                dir="ltr"
                placeholder={t("pages.boxes.goalPlaceholder")}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setEditor({ open: false, box: null })}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" isPending={saving} isDisabled={!title.trim()}>
                {t("common.save")}
              </Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>

      {/* deposit / withdraw */}
      <AppModal open={Boolean(move)} onOpenChange={(open) => !open && setMove(null)}>
        <AppModalDialog>
          <form onSubmit={(e) => void submitMove(e)}>
            <AppModalHeader onClose={() => setMove(null)}>
              <Modal.Heading>
                {move?.direction === "in"
                  ? t("pages.boxes.depositTo", { title: move?.box.title ?? "" })
                  : t("pages.boxes.withdrawFrom", { title: move?.box.title ?? "" })}
              </Modal.Heading>
            </AppModalHeader>
            <Modal.Body className="space-y-3">
              <p className="text-xs leading-6 text-muted">
                {move?.direction === "in" ? t("pages.boxes.depositHint") : t("pages.boxes.withdrawHint")}
              </p>
              <FormInput
                label={t("budget.amountWithCurrency", { currency: unit })}
                value={formatPriceInput(amount, true)}
                onChange={(e) => setAmount(parsePriceInput(e.target.value, true))}
                inputMode="numeric"
                dir="ltr"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="pb-press rounded-full border border-border/60 bg-surface-secondary px-3 py-1 text-xs font-medium hover:border-accent/40"
                    onClick={() => setAmount(String(value))}
                  >
                    {formatPrice(value)}
                  </button>
                ))}
                {move?.direction === "out" && move.box.budget > 0 ? (
                  <button
                    type="button"
                    className="pb-press rounded-full border border-border/60 bg-surface-secondary px-3 py-1 text-xs font-medium hover:border-accent/40"
                    onClick={() => setAmount(String(move.box.budget))}
                  >
                    {t("pages.boxes.all")}
                  </button>
                ) : null}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setMove(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" isPending={moving} isDisabled={!amount || Number(amount) <= 0}>
                {move?.direction === "in" ? t("pages.boxes.deposit") : t("pages.boxes.withdraw")}
              </Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>

      {/* delete */}
      <AppModal open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader onClose={() => setRemoving(null)}>
            <Modal.Heading>{t("pages.boxes.deleteTitle", { title: removing?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">
              {removing && removing.budget > 0
                ? t("pages.boxes.deleteWithMoney", { amount: `${formatPrice(removing.budget)} ${unit}` })
                : t("pages.boxes.deleteEmpty")}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={removeBusy} onPress={() => void confirmRemove()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
