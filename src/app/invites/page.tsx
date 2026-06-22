import { PendingInvitesBanner } from "@/components/pages/partners/PendingInvitesBanner";

export default function Page() {
  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <h1 className="text-2xl font-bold">دعوت‌های همکاری</h1>
        <p className="mt-2 text-sm text-muted">
          دعوت‌هایی که دیگران برای شریک شدن در پروژه یا کسب‌وکار فرستاده‌اند.
        </p>
      </section>
      <PendingInvitesBanner />
    </div>
  );
}
