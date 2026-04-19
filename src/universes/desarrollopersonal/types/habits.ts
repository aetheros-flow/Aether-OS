export type TaskType = 'single' | 'recurring';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon_name: string;
  color: string;
  is_default: boolean;
}

export interface Habit {
  id: string;
  user_id: string;
  category_id?: string;
  name: string;
  frequency_type: string;
  days_of_week?: number[]; // Restaurado para evitar el error de la captura 3
  icon_name?: string;      // Restaurado para evitar el error de la captura 1
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export interface TodayHabit extends Habit {
  done: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  task_type: TaskType;
  is_completed: boolean;
  due_date?: string;
  created_at: string;
}