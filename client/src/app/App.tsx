import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { TopNav } from '../components/TopNav';
import { ToastContainer } from '../components/ToastContainer';
import { useAppStore } from '../lib/store';

export function App() {
  // Initialize theme from localStorage on app start
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Use saved theme or system preference
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      
      // Set the theme state
      useAppStore.setState({ isDarkMode: shouldBeDark });
      
      // Update the HTML class
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.warn('Failed to initialize theme:', error);
      // Fallback to light mode
      useAppStore.setState({ isDarkMode: false });
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <RouterProvider router={router} />
      </main>
      <ToastContainer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  );
}
