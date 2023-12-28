import { combineReducers } from "redux";

import AuthReducer from "./Auth";

const RootReducer = combineReducers({
  auth: AuthReducer,
});

export default RootReducer;