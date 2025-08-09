import { lazy } from 'react';

// Lazy load route components
export const Dashboard = lazy(() => import('../pages/dashboard'));
export const Inventory = lazy(() => import('../pages/inventory'));
export const SchedulePickup = lazy(() => import('../pages/schedule-pickup'));
export const ScheduleDelivery = lazy(() => import('../pages/schedule-delivery'));
export const Appointments = lazy(() => import('../pages/appointments'));
export const Analytics = lazy(() => import('../pages/analytics'));
export const Profile = lazy(() => import('../pages/profile'));
export const Subscription = lazy(() => import('../pages/subscription'));
export const SetupPayment = lazy(() => import('../pages/setup-payment'));
export const Admin = lazy(() => import('../pages/admin'));

// Lazy load heavy components
export const AIChatbot = lazy(() => import('../components/ai-chatbot'));
export const AppointmentCalendar = lazy(() => import('../components/appointment-calendar'));
export const CategoryChart = lazy(() => import('../components/category-chart'));
export const InventoryInsights = lazy(() => import('../components/inventory-insights'));