"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { Add, Box1, Edit2, Trash } from "iconsax-reactjs";

import * as boxesApi from "@/common/api/boxes";
import type { IBox } from "@/common/interfaces/box.interface";
import { formatPrice, formatPriceInput, getJalaliNow, parsePriceInput } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { boxesSelector, setBoxes } from "@/stores/box";

export function BoxesPage() {
  const dispatch = useAppDispatch();
  const boxes = useAppSelector(boxesSelector);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editBox, setEditBox] = useState<IBox | null>(null);
  const [title, setTitle] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void boxesApi.fetchBoxes().then((data) => {
      dispatch(setBoxes(data));
      setLoading(false);
    });
  }, [dispatch]);

  async function saveBox(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editBox) {
        const updated = await boxesApi.updateBox(editBox._id, { title });
        dispatch(
          setBoxes((boxes ?? []).map((b) => (b._id === updated._id ? updated : b))),
        );
        showToast("صندوق ویرایش شد", "success");
      } else {
        const created = await boxesApi.createBox({ title });
        dispatch(setBoxes([...(boxes ?? []), created]));
        showToast("صندوق ایجاد شد", "success");
      }
      setCreateOpen(false);
      setEditBox(null);
      setTitle("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function addBudget(box: IBox) {
    if (!budgetAmount) return;
    const now = getJalaliNow();
    try {
      await boxesApi.changeBoxBudget(box._id, {
        price: parsePriceInput(budgetAmount, true),
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
      });
      const refreshed = await boxesApi.fetchBoxes();
      dispatch(setBoxes(refreshed));
      setBudgetAmount("");
      showToast("موجودی صندوق به‌روز شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function removeBox(box: IBox) {
    const now = getJalaliNow();
    try {
      await boxesApi.softDeleteBox(box._id, {
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
      });
      dispatch(setBoxes((boxes ?? []).filter((b) => b._id !== box._id)));
      showToast("صندوق حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">صندوق‌ها</h2>
          <p className="text-sm text-muted">مدیریت پس‌انداز و بودجه‌های جدا</p>
        </div>
        <Button
          isIconOnly
          className="bg-accent text-accent-foreground"
          onPress={() => {
            setEditBox(null);
            setTitle("");
            setCreateOpen(true);
          }}
        >
          <Add size={20} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-28 w-full" />
          ))}
        </div>
      ) : !boxes?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Box1 size={36} className="mx-auto mb-3 text-muted" />
          <p>هنوز صندوقی نساخته‌اید</p>
        </div>
      ) : (
        <div className="pb-card-grid">
          {boxes.map((box) => (
            <article key={box._id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{box.title}</h3>
                  <p className="mt-1 text-2xl font-bold">
                    {formatPrice(box.budget)}{" "}
                    <span className="text-sm font-normal text-muted">تومان</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setEditBox(box);
                      setTitle(box.title);
                      setCreateOpen(true);
                    }}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="danger"
                    onPress={() => void removeBox(box)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="مبلغ افزایش/کاهش"
                  value={formatPriceInput(budgetAmount, true)}
                  onChange={(e) =>
                    setBudgetAmount(parsePriceInput(e.target.value, true))
                  }
                  variant="secondary"
                  inputMode="numeric"
                  dir="ltr"
                  className="flex-1 text-left"
                />
                <Button size="sm" onPress={() => void addBudget(box)}>
                  اعمال
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AppModal open={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Dialog>
          <form onSubmit={(e) => void saveBox(e)}>
            <AppModalHeader onClose={() => setCreateOpen(false)}>
              <Modal.Heading>{editBox ? "ویرایش صندوق" : "صندوق جدید"}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body>
              <FormInput label="نام صندوق" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setCreateOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" isPending={saving}>
                ذخیره
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </AppModal>
    </div>
  );
}
