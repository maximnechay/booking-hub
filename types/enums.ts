// types/enums.ts

// Базовые типы
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type UserRole = 'owner' | 'admin' | 'staff'

export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no_show'