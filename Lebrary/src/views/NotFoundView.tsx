import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundView() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-24 text-center">
      <p className="font-serif text-7xl text-lumen-500 dark:text-lumen-400">404</p>
      <h1 className="font-serif text-3xl text-ink-900 dark:text-ink-50">This page is uncharted.</h1>
      <p className="text-ink-700 dark:text-ink-100">
        The page you're looking for isn't on any shelf.
      </p>
      <Link to="/">
        <Button variant="primary">Return to the library</Button>
      </Link>
    </div>
  );
}
