/*
 * Cafe Bazaar in-app billing through the Android app's native plugin (Poolakey).
 * The phone only starts the purchase; the server verifies the token with Bazaar
 * and grants the subscription, so a patched app cannot mint plans.
 * Outside the Android app none of this exists and the web purchase flow is used.
 */

export interface BazaarStorePurchase {
  productId: string;
  purchaseToken: string;
  orderId: string;
  payload: string;
}

const PLUGIN = "BazaarBilling";

// The web app is loaded from pdesk.ir inside the Android shell, so the Capacitor
// JS package is not bundled; the shell injects this global bridge instead.
type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  isPluginAvailable?: (name: string) => boolean;
  nativePromise?: <T>(plugin: string, method: string, options?: unknown) => Promise<T>;
};

export type BazaarErrorCode = "canceled" | "bazaar_missing" | "failed";

export class BazaarError extends Error {
  constructor(
    readonly code: BazaarErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function bridge(): Required<Pick<CapacitorGlobal, "nativePromise">> | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!capacitor?.isNativePlatform?.() || !capacitor.isPluginAvailable?.(PLUGIN) || !capacitor.nativePromise) return null;
  return { nativePromise: capacitor.nativePromise.bind(capacitor) };
}

/** True only inside the Android app, where Bazaar billing is available. */
export function isBazaarBillingAvailable() {
  return bridge() !== null;
}

function toBazaarError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "canceled") return new BazaarError("canceled", "canceled");
  if (code === "bazaar_missing") return new BazaarError("bazaar_missing", "bazaar_missing");
  return new BazaarError("failed", "failed");
}

/** Opens the Bazaar payment sheet. `userId` binds the purchase to this account. */
export async function purchaseWithBazaar(productId: string, userId: string) {
  const native = bridge();
  if (!native) throw new BazaarError("failed", "failed");
  try {
    return await native.nativePromise<BazaarStorePurchase>(PLUGIN, "purchase", { productId, payload: userId });
  } catch (error) {
    throw toBazaarError(error);
  }
}

/** Purchases that were paid but never redeemed (app killed, network dropped). */
export async function pendingBazaarPurchases(userId: string) {
  const native = bridge();
  if (!native) return [];
  try {
    const { purchases } = await native.nativePromise<{ purchases: BazaarStorePurchase[] }>(PLUGIN, "pending");
    return purchases.filter((purchase) => purchase.payload === userId);
  } catch {
    return [];
  }
}
