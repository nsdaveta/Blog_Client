import react from 'react';

const UserContext = react.createContext();
export default UserContext;

const UserContextProvider = ({children})=>{
    const [user,setUser] = react.useState(null);
    return (
        <UserContext.Provider value={{user,setUser}}>
            {children}
        </UserContext.Provider>
    )
}
export {UserContextProvider};       