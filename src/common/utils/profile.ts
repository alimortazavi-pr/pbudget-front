import type { IProfile } from "@/common/interfaces/profile.interface";

export function normalizeProfile(user: Record<string, unknown>): IProfile {
  return {
    _id: String(user._id ?? ""),
    firstName: String(user.firstName ?? ""),
    lastName: String(user.lastName ?? ""),
    mobile: String(user.mobile ?? ""),
    budget: Number(user.budget ?? 0),
    isVerifiedMobile: Boolean(user.isVerifiedMobile ?? user.mobileActive),
    hasPassword:
      user.hasPassword !== undefined ? Boolean(user.hasPassword) : undefined,
  };
}
