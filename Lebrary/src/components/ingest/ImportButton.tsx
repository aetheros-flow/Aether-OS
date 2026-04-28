import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImportModal } from '@/components/ingest/ImportModal';

export function ImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="md"
        leadingIcon={<Plus className="h-4 w-4" strokeWidth={2.5} />}
        onClick={() => setOpen(true)}
        title="Import a book — upload a .txt (dev) or search by title + author"
      >
        Import book
      </Button>
      <ImportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
