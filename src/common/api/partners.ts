import { axiosInstance } from "@/common/axiosInstance";
import type {
  ICreatePartnerResult,
  IMyPartners,
  IPartner,
  IPartnerActivity,
  IPartnerInviteInfo,
  IPartnerLookupResult,
  IPartnerSettlement,
  IPartnerSettlementBatch,
  IPendingPartnerInvite,
  IVenture,
  IVentureDetail,
  PartnerPermissionLevel,
} from "@/common/interfaces/partner.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";

export async function fetchPendingInvites() {
  const { data } = await axiosInstance.get<{ invites: IPendingPartnerInvite[] }>(
    "/partners/pending-invites",
  );
  return data.invites;
}

export async function fetchProjectSettlement(projectId: string) {
  const { data } = await axiosInstance.get<IPartnerSettlement>(
    `/projects/${projectId}/partners/settlement`,
  );
  return data;
}

export async function fetchVentureSettlement(ventureId: string) {
  const { data } = await axiosInstance.get<IPartnerSettlement>(
    `/ventures/${ventureId}/partners/settlement`,
  );
  return data;
}

export async function lookupPartnerMobile(mobile: string) {
  const { data } = await axiosInstance.post<IPartnerLookupResult>(
    "/partners/lookup-mobile",
    { mobile },
  );
  return data;
}

export async function fetchMyPartners() {
  const { data } = await axiosInstance.get<IMyPartners>("/partners/mine");
  return data;
}

export async function fetchProjectPartners(projectId: string) {
  const { data } = await axiosInstance.get<{ partners: IPartner[] }>(
    `/projects/${projectId}/partners`,
  );
  return data.partners;
}

export async function createProjectPartner(
  projectId: string,
  payload: {
    mobile: string;
    displayName?: string;
    sharePercent?: number;
    notes?: string;
    permissionLevel?: PartnerPermissionLevel;
  },
) {
  const { data } = await axiosInstance.post<ICreatePartnerResult>(
    `/projects/${projectId}/partners`,
    payload,
  );
  return data;
}

export async function fetchVenturePartners(ventureId: string) {
  const { data } = await axiosInstance.get<{ partners: IPartner[] }>(
    `/ventures/${ventureId}/partners`,
  );
  return data.partners;
}

export async function createVenturePartner(
  ventureId: string,
  payload: {
    mobile: string;
    displayName?: string;
    sharePercent?: number;
    notes?: string;
    permissionLevel?: PartnerPermissionLevel;
  },
) {
  const { data } = await axiosInstance.post<ICreatePartnerResult>(
    `/ventures/${ventureId}/partners`,
    payload,
  );
  return data;
}

export async function updatePartner(
  partnerId: string,
  payload: {
    displayName?: string;
    sharePercent?: number;
    notes?: string;
    permissionLevel?: PartnerPermissionLevel;
  },
) {
  const { data } = await axiosInstance.patch<{ partner: IPartner }>(
    `/partners/${partnerId}`,
    payload,
  );
  return data.partner;
}

export async function deletePartner(partnerId: string) {
  await axiosInstance.delete(`/partners/${partnerId}`);
}

export async function resendPartnerInvite(partnerId: string) {
  const { data } = await axiosInstance.post<{
    inviteLink: string;
    telegramSent: boolean;
  }>(`/partners/${partnerId}/resend-invite`);
  return data;
}

export async function fetchPartnerInvite(token: string) {
  const { data } = await axiosInstance.get<IPartnerInviteInfo>(
    `/partner-invites/${token}`,
  );
  return data;
}

export async function acceptPartnerInvite(token: string) {
  const { data } = await axiosInstance.post<{ message: string }>(
    `/partner-invites/${token}/accept`,
  );
  return data;
}

export async function declinePartnerInvite(token: string) {
  const { data } = await axiosInstance.post<{ message: string }>(
    `/partner-invites/${token}/decline`,
  );
  return data;
}

export async function fetchVentures() {
  const { data } = await axiosInstance.get<{ ventures: IVenture[] }>("/ventures");
  return data.ventures;
}

export async function fetchVenture(id: string) {
  const { data } = await axiosInstance.get<IVentureDetail>(`/ventures/${id}`);
  return data;
}

export async function createVenture(payload: {
  title: string;
  description?: string;
}) {
  const { data } = await axiosInstance.post<{ venture: IVenture }>(
    "/ventures",
    payload,
  );
  return data.venture;
}

export async function updateVenture(
  id: string,
  payload: { title?: string; description?: string },
) {
  const { data } = await axiosInstance.patch<{ venture: IVenture }>(
    `/ventures/${id}`,
    payload,
  );
  return data.venture;
}

export async function deleteVenture(id: string) {
  await axiosInstance.delete(`/ventures/${id}`);
}

export async function fetchPartnerActivity(
  contextType: "project" | "venture",
  contextId: string,
) {
  const base =
    contextType === "project"
      ? `/projects/${contextId}/partners/activity`
      : `/ventures/${contextId}/partners/activity`;
  const { data } = await axiosInstance.get<{ activities: IPartnerActivity[] }>(base);
  return data.activities;
}

export async function applyPartnerSettlement(
  contextType: "project" | "venture",
  contextId: string,
  categoryId: string,
) {
  const base =
    contextType === "project"
      ? `/projects/${contextId}/partners/settlement/apply`
      : `/ventures/${contextId}/partners/settlement/apply`;
  const { data } = await axiosInstance.post<{
    message: string;
    batch: IPartnerSettlementBatch;
  }>(base, { categoryId });
  return data;
}

export async function fetchSettlementBatches(
  contextType: "project" | "venture",
  contextId: string,
) {
  const base =
    contextType === "project"
      ? `/projects/${contextId}/partners/settlement/batches`
      : `/ventures/${contextId}/partners/settlement/batches`;
  const { data } = await axiosInstance.get<{ batches: IPartnerSettlementBatch[] }>(base);
  return data.batches;
}

export async function fetchVentureBudgetCandidates(ventureId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/ventures/${ventureId}/budget-candidates`,
  );
  return data.budgets;
}

export async function fetchVentureBudgets(ventureId: string) {
  const { data } = await axiosInstance.get<{ budgets: IBudget[] }>(
    `/ventures/${ventureId}/budgets`,
  );
  return data.budgets;
}

export async function attachVentureBudget(ventureId: string, budgetId: string) {
  const { data } = await axiosInstance.post<{ budget: IBudget }>(
    `/ventures/${ventureId}/attach-budget`,
    { budgetId },
  );
  return data.budget;
}
