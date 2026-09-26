import React, { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType>({
  isVisible: true,
  setIsVisible: () => {},
});

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <NavbarContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => useContext(NavbarContext);
