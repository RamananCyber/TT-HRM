// src/contexts/UserContext.js
import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userPhoto, setUserPhoto] = useState(null);

  return (
    <UserContext.Provider value={{ userPhoto, setUserPhoto }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);