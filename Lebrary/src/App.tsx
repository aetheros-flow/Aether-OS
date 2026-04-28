import { RouterProvider } from 'react-router-dom';
import { router } from '@/router/router';
import { ThemeProvider } from '@/context/ThemeContext';
import { ContentLanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ContentLanguageProvider>
          <RouterProvider router={router} />
        </ContentLanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
