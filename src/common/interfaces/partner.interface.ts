export type PartnerContextType = "project" | "venture";

export type PartnerStatus = "pending" | "active" | "declined";

export type AccessRole = "owner" | "partner";

export type PartnerPermissionLevel = "viewer" | "editor" | "owner";

export interface IPartnerSettlementRow {
  partnerId: string | null;
  displayName: string;
  sharePercent: number;
  profitShare: number;
  receivedShare: number;
  spentShare: number;
  isOwner?: boolean;
}

export interface IPartnerSettlement {
  contextType: PartnerContextType;
  contextId: string;
  contextTitle: string;
  accessRole: AccessRole;
  permissionLevel?: PartnerPermissionLevel;
  hasFinancials?: boolean;
  note?: string;
  receivedAmount: number;
  spentAmount: number;
  profitAmount: number;
  remainingAmount: number;
  allocatedPercent: number;
  ownerSharePercent: number;
  unallocatedPercent: number;
  partners: IPartnerSettlementRow[];
}

export interface IPendingPartnerInvite {
  _id: string;
  contextType: PartnerContextType;
  contextId: string;
  contextTitle: string;
  ownerName: string;
  sharePercent: number;
  displayName: string;
  expiresAt: string;
  inviteLink?: string | null;
}

export interface IPartner {
  _id: string;
  owner: string;
  contextType: PartnerContextType;
  contextId: string;
  partnerUser?: string;
  displayName: string;
  mobile: string;
  sharePercent: number;
  permissionLevel?: PartnerPermissionLevel;
  status: PartnerStatus;
  isAppUser: boolean;
  telegramNotified: boolean;
  notes: string;
  inviteLink?: string | null;
  contextTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPartnerLookupResult {
  exists: boolean;
  hasTelegram: boolean;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    displayName: string;
  };
}

export interface ICreatePartnerResult {
  partner: IPartner;
  inviteLink?: string | null;
  telegramSent: boolean;
  hasTelegram: boolean;
}

export interface IVenture {
  _id: string;
  title: string;
  description: string;
  partnerCount?: number;
  accessRole?: AccessRole;
  permissionLevel?: PartnerPermissionLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface IVentureDetail {
  venture: IVenture;
  partners: IPartner[];
  stats?: {
    receivedAmount: number;
    spentAmount: number;
    profitAmount: number;
    transactionCount: number;
  };
}

export interface IPartnerInviteInfo {
  contextType: PartnerContextType;
  contextTitle: string;
  ownerName: string;
  displayName: string;
  mobile: string;
  sharePercent: number;
  expiresAt: string;
}

export interface IMyPartners {
  owned: IPartner[];
  invited: IPartner[];
}

export type PartnerActivityAction =
  | "invited"
  | "accepted"
  | "declined"
  | "share_changed"
  | "permission_changed"
  | "removed"
  | "settlement_applied"
  | "budget_attached";

export interface IPartnerActivity {
  _id: string;
  action: PartnerActivityAction;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface IPartnerSettlementBatch {
  _id: string;
  profitAmount: number;
  debts: Array<{
    displayName: string;
    amount: number;
  }>;
  createdAt: string;
}

export interface IPartnerDebtRelation {
  person: string;
  owesAmount: number;
  owedAmount: number;
}

export interface IPartnerDebtBalance {
  partnerId: string;
  displayName: string;
  owesAmount: number;
  owedAmount: number;
  netBalance: number;
  relations: Array<{
    person: string;
    owesAmount: number;
    owedAmount: number;
    source?: "ledger" | "debt";
  }>;
}

export interface IPartnerDebtBalances {
  ownerName: string;
  hasTransactions?: boolean;
  partners: IPartnerDebtBalance[];
}
