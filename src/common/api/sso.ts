import { axiosInstance } from "@/common/axiosInstance";
import type { IProfile } from "@/common/interfaces/profile.interface";

/** One-time ticket (60 s) that signs the current user into business.pdesk.ir. */
export async function getBusinessTicket() {
  const { data } = await axiosInstance.post<{ ticket: string }>("/sso/business-ticket");
  return data.ticket;
}

/** Exchanges a ticket minted by the business product for a personal session. */
export async function consumeTicket(ticket: string) {
  const { data } = await axiosInstance.post<{ user: IProfile; token: string }>(
    "/sso/consume",
    { ticket },
  );
  return data;
}
