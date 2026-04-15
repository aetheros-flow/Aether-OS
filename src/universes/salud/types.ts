export interface Metric {
  id: string;
  weight: number;
  body_fat: number;
  sleep_hours: number;
  water_liters: number;
  date: string;
}

export interface Workout {
  id: string;
  type: string;
  duration_mins: number;
  intensity: string;
  calories_burned: number;
  date: string;
}

export interface Nutrition {
  id: string;
  meal_type: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string;
}

export interface Medical {
  id: string;
  title: string;
  specialty: string;
  date: string;
  status: string;
}

export interface NewMetricInput {
  weight: string;
  body_fat: string;
  sleep_hours: string;
  water_liters: string;
  date: string;
}

export interface NewWorkoutInput {
  type: string;
  duration_mins: string;
  intensity: string;
  calories_burned: string;
  date: string;
  time: string;
}
