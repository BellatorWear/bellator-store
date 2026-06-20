"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Dein Typen-Def
type CartItem = { id: string; name: string; price: number; size: string; quantity: number; image: string; };

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string, size: string) => void;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
  }, [cart]);

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setCart((prev) => [...prev, { ...newItem, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, cartCount, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart muss innerhalb eines CartProvider genutzt werden");
  return context;
};
