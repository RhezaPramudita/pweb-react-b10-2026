import type { Application } from '../types/index.ts';
import './warroom.css';

interface Props {
  deleted: Application | null;
  onUndo: () => void;
}

export function UndoToast({ deleted, onUndo }: Props) {
  if (!deleted) return null;
  return (
    <div className="wr-toast" role="status">
      <span>
        Lamaran <strong>{deleted.company}</strong> telah dihapus.
      </span>
      <button type="button" onClick={onUndo}>Undo</button>
    </div>
  );
}
