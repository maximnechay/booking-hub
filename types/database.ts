// types/database.ts

import type {
    Tenant,
    User,
    Service,
    Staff,
    StaffService,
    WorkingHours,
    StaffSchedule,
    Booking,
} from './models'
import type { UserRole, BookingStatus } from './enums'

// Главный тип для Supabase клиента
export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: Tenant
                Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Tenant, 'id'>>
            }
            users: {
                Row: User
                Insert: Omit<User, 'created_at' | 'updated_at'>
                Update: Partial<Omit<User, 'id'>>
            }
            services: {
                Row: Service
                Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Service, 'id'>>
            }
            staff: {
                Row: Staff
                Insert: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Staff, 'id'>>
            }
            staff_services: {
                Row: StaffService
                Insert: StaffService
                Update: Partial<StaffService>
            }
            working_hours: {
                Row: WorkingHours
                Insert: Omit<WorkingHours, 'id'>
                Update: Partial<Omit<WorkingHours, 'id'>>
            }
            staff_schedule: {
                Row: StaffSchedule
                Insert: Omit<StaffSchedule, 'id'>
                Update: Partial<Omit<StaffSchedule, 'id'>>
            }
            bookings: {
                Row: Booking
                Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Booking, 'id'>>
            }
        }
        Functions: {
            get_current_tenant_id: {
                Args: Record<string, never>
                Returns: string
            }
        }
        Enums: {
            user_role: UserRole
            booking_status: BookingStatus
        }
    }
}