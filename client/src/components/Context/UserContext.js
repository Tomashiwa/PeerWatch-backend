import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export const useUser = () => {
	return useContext(UserContext);
};

export function UserProvider({ children }) {
	const [userInfo, setUserInfo] = useState(null);
	
	return (
		<UserContext.Provider value={{userInfo, setUserInfo}}>
			{children}
		</UserContext.Provider>
	);
}