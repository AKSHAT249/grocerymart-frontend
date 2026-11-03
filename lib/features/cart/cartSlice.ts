import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from './cartTypes';


const initialState: CartState = {
    items: [],
}


const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {

        addToCart: (state, action: PayloadAction<CartItem>) => {
            const { id, name, price, image, quantity } = action.payload;
            const existingItem = state.items.find((item) => item.id === id);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                state.items.push(action.payload);
            }
        },
        increaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.items.find((item) => item.id === action.payload);
            if (item) {
                item.quantity++;
            }
        },
        decreaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.items.find((item) => item.id === action.payload);
            if (!item) return;
            item.quantity -= 1;
            if (item.quantity <= 0) {
                state.items = state.items.filter((entry) => entry.id !== action.payload);
            }
        },
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((item) => item.id !== action.payload);
        },
        clearCart: (state) => {
            state.items = [];
        },
        calculateTotal: (state) => {
            state.items.reduce((total, item) => total + item.price * item.quantity, 0);
        },
        
    }
})


export const {
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    calculateTotal,
  } = cartSlice.actions;
  
  export default cartSlice.reducer;