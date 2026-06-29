import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  BusinessPermission,
  IBusiness,
  IBusinessWorkspaceContext,
} from "@/common/interfaces/business.interface";
import type { RootState } from "@/stores";

type BusinessContextState = {
  activeBusinessId: string | null;
  businesses: IBusiness[];
  workspace: IBusinessWorkspaceContext | null;
  loading: boolean;
};

const initialState: BusinessContextState = {
  activeBusinessId: null,
  businesses: [],
  workspace: null,
  loading: false,
};

export const businessContextSlice = createSlice({
  name: "businessContext",
  initialState,
  reducers: {
    setActiveBusinessId(state, action: PayloadAction<string | null>) {
      state.activeBusinessId = action.payload;
    },
    setBusinesses(state, action: PayloadAction<IBusiness[]>) {
      state.businesses = action.payload;
    },
    setWorkspaceContext(
      state,
      action: PayloadAction<IBusinessWorkspaceContext | null>,
    ) {
      state.workspace = action.payload;
      if (action.payload) {
        state.activeBusinessId = action.payload.businessId;
      }
    },
    setBusinessLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    clearBusinessContext(state) {
      state.activeBusinessId = null;
      state.workspace = null;
    },
  },
});

export const {
  setActiveBusinessId,
  setBusinesses,
  setWorkspaceContext,
  setBusinessLoading,
  clearBusinessContext,
} = businessContextSlice.actions;

export const businessContextReducer = businessContextSlice.reducer;

export const activeBusinessIdSelector = (state: RootState) =>
  state.businessContext.activeBusinessId;

export const businessesSelector = (state: RootState) =>
  state.businessContext.businesses;

export const workspaceContextSelector = (state: RootState) =>
  state.businessContext.workspace;

export function hasBusinessPermission(
  permissions: BusinessPermission[] | undefined,
  required: BusinessPermission | BusinessPermission[],
) {
  if (!permissions?.length) return false;
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => permissions.includes(p));
}

export const businessPermissionsSelector = (state: RootState) =>
  state.businessContext.workspace?.permissions ?? [];
