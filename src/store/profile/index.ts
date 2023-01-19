import { createSlice } from "@reduxjs/toolkit";

//Interfaces
import { IProfileState } from "@/ts/interfaces/profile.interface";

//Reducers
import reducers from "@/store/profile/reducers";

const initialState: IProfileState = {
  user: {
    _id: "",
    firstName: "",
    lastName: "",
    mobile: "",
    profileImage: "",
    mobileActive: false,
    budget: null,
    deleted: false,
  },
};

export const profileReducer = createSlice({
  name: "profile",
  initialState,
  reducers,
});

export default profileReducer.reducer;
