// types/models/schedule.ts

export interface WorkingHours {
    id: string
    tenant_id: string
    day_of_week: number  // 0-6, 0 = Понедельник
    open_time: string    // "09:00"
    close_time: string   // "18:00"
    is_open: boolean
}

export interface StaffSchedule {
    id: string
    staff_id: string
    day_of_week: number
    start_time: string
    end_time: string
    break_start: string | null
    break_end: string | null
    is_working: boolean
}