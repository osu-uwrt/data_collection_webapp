import React, { createContext, useState, useContext } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [teamName, setTeamName] = useState(null);
  const [username, setUsername] = useState(null);

  // Add more state variables/methods as needed

  return (
    <AppContext.Provider
      value={{ teamName, setTeamName, username, setUsername }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
