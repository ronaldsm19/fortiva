import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { MonthProvider } from '@/context/MonthContext';
import { AuthProvider } from '@/context/AuthContext';
import { HouseholdProvider } from '@/context/HouseholdContext';

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <MonthProvider>
          <AuthProvider>
            <HouseholdProvider>
              <RouterProvider router={router} />
            </HouseholdProvider>
          </AuthProvider>
        </MonthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
