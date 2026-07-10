"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Card, Edit2, Star1, Trash } from "iconsax-reactjs";

import * as paymentCardsApi from "@/common/api/payment-cards";
import { DEFAULT_CATEGORY_COLORS } from "@/common/constants/category-colors";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import {
  getDefaultPaymentCardId,
  setDefaultPaymentCardId,
} from "@/common/utils/default-payment-card";
import {
  formatCardNumberDisplay,
  normalizeCardNumber,
  paymentCardSubtitle,
} from "@/common/utils/payment-card";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { CategoryColorPicker } from "@/components/common/form/CategoryColorPicker";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function PaymentCardsPage() {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<IPaymentCard | null>(null);
  const [title, setTitle] = useState("");
  const [bankName, setBankName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLORS[4]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDefaultCardId(getDefaultPaymentCardId(user?._id));
    void paymentCardsApi.fetchPaymentCards().then((data) => {
      setCards(data);
      setLoading(false);
    });
  }, [user?._id]);

  function toggleDefaultCard(card: IPaymentCard) {
    const nextId = defaultCardId === card._id ? null : card._id;
    setDefaultPaymentCardId(nextId, user?._id);
    setDefaultCardId(nextId);
    showToast(
      nextId ? "کارت به‌عنوان مبدا پیش‌فرض تنظیم شد" : "مبدا پیش‌فرض حذف شد",
      "success",
    );
  }

  function openCreate() {
    setEditItem(null);
    setTitle("");
    setBankName("");
    setLastFour("");
    setColor(DEFAULT_CATEGORY_COLORS[4]);
    setOpen(true);
  }

  function openEdit(card: IPaymentCard) {
    setEditItem(card);
    setTitle(card.title);
    setBankName(card.bankName);
    setLastFour(card.lastFour);
    setColor(card.color || DEFAULT_CATEGORY_COLORS[4]);
    setOpen(true);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        bankName: bankName.trim(),
        lastFour: normalizeCardNumber(lastFour),
        color,
      };

      if (editItem) {
        const updated = await paymentCardsApi.updatePaymentCard(editItem._id, payload);
        setCards((prev) => prev.map((card) => (card._id === updated._id ? updated : card)));
      } else {
        const created = await paymentCardsApi.createPaymentCard(payload);
        setCards((prev) => [...prev, created]);
      }

      showToast(t("ذخیره شد"), "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function remove(card: IPaymentCard) {
    try {
      await paymentCardsApi.softDeletePaymentCard(card._id);
      setCards((prev) => prev.filter((item) => item._id !== card._id));
      if (defaultCardId === card._id) {
        setDefaultPaymentCardId(null, user?._id);
        setDefaultCardId(null);
      }
      showToast(t("حذف شد"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t("کارت‌های من")}</h2>
          <p className="text-sm text-muted">
            مبدا پرداخت یا مقصد دریافت تراکنش‌ها. با ستاره، کارت مبدا پیش‌فرض را
            انتخاب کنید.
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground" onPress={openCreate}>
          <Add size={18} />
          کارت جدید
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("در حال بارگذاری…")}</div>
      ) : cards.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Card size={36} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{t("هنوز کارتی ثبت نشده")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <article key={card._id} className="glass flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded-xl"
                  style={{ backgroundColor: card.color || "#3b82f6" }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{card.title}</p>
                    {defaultCardId === card._id ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        مبدا پیش‌فرض
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted">
                    {paymentCardSubtitle(card.bankName, card.lastFour) ||
                      "بدون جزئیات بانک"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant={defaultCardId === card._id ? "primary" : "ghost"}
                  aria-label={
                    defaultCardId === card._id
                      ? "حذف مبدا پیش‌فرض"
                      : "تنظیم به‌عنوان مبدا پیش‌فرض"
                  }
                  onPress={() => toggleDefaultCard(card)}
                >
                  <Star1
                    size={16}
                    variant={defaultCardId === card._id ? "Bold" : "Linear"}
                  />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" onPress={() => openEdit(card)}>
                  <Edit2 size={16} />
                </Button>
                <Button isIconOnly size="sm" variant="danger" onPress={() => void remove(card)}>
                  <Trash size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog className="sm:max-w-md">
          <form onSubmit={(e) => void save(e)}>
            <AppModalHeader onClose={() => setOpen(false)}>
              <Modal.Heading>{editItem ? "ویرایش کارت" : "کارت جدید"}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body className="space-y-4">
              <FormInput label={t("نام کارت")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("مثلاً کارت ملی")} />
              <FormInput label={t("بانک — اختیاری")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <FormInput
                label={t("شماره کارت — اختیاری")}
                value={formatCardNumberDisplay(lastFour)}
                onChange={(e) => setLastFour(normalizeCardNumber(e.target.value))}
                inputMode="numeric"
                placeholder={t("۱۶ رقم")}
                maxLength={19}
              />
              <CategoryColorPicker value={color} onChange={setColor} />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setOpen(false)}>{t("انصراف")}</Button>
              <Button type="submit" isPending={saving}>{t("ذخیره")}</Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
