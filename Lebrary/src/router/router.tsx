import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthGate } from '@/components/auth/AuthGate';
import { LibraryView } from '@/views/LibraryView';
import { BookDetailView } from '@/views/BookDetailView';
import { ReaderView } from '@/views/ReaderView';
import { QuizView } from '@/views/QuizView';
import { AuthorsView } from '@/views/AuthorsView';
import { AuthorProfileView } from '@/views/AuthorProfileView';
import { NotebookView } from '@/views/NotebookView';
import { FavoritesView } from '@/views/FavoritesView';
import { FinishedBooksView } from '@/views/FinishedBooksView';
import { StatsView } from '@/views/StatsView';
import { LoginView } from '@/views/LoginView';
import { ReviewView } from '@/views/ReviewView';
import { CollectionsView } from '@/views/CollectionsView';
import { CollectionView } from '@/views/CollectionView';
import { NotFoundView } from '@/views/NotFoundView';

const gated = (el: React.ReactElement) => <AuthGate>{el}</AuthGate>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginView /> },
      { index: true, element: gated(<LibraryView />) },
      { path: 'books/:bookId', element: gated(<BookDetailView />) },
      { path: 'books/:bookId/read/:chapterOrder', element: gated(<ReaderView />) },
      { path: 'books/:bookId/quiz', element: gated(<QuizView />) },
      { path: 'authors', element: gated(<AuthorsView />) },
      { path: 'authors/:authorId', element: gated(<AuthorProfileView />) },
      { path: 'notebook', element: gated(<NotebookView />) },
      { path: 'favorites', element: gated(<FavoritesView />) },
      { path: 'shelves', element: gated(<CollectionsView />) },
      { path: 'shelves/:collectionId', element: gated(<CollectionView />) },
      { path: 'review', element: gated(<ReviewView />) },
      { path: 'finished', element: gated(<FinishedBooksView />) },
      { path: 'stats', element: gated(<StatsView />) },
      { path: '*', element: <NotFoundView /> },
    ],
  },
]);
