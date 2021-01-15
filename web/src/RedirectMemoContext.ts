// Auth0 redirects let us pass some information to our future selves. We dump that into here.

import { createContext } from "react";

export default createContext({redirectMemo: null as null | {}, setRedirectMemo: (val: any) => {}});
