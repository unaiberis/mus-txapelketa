import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TournamentApp from '../TournamentApp';
import { DEFAULT_LANG, t } from '../../lib/i18n';

describe('TournamentApp drag-and-drop', () => {
  it('reorders pairs when dragged and dropped', () => {
    render(<TournamentApp />);

    const p1 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder1'));
    const p2 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder2'));
    const addBtn = screen.getByRole('button', { name: t(DEFAULT_LANG, 'addPair.addButton') });

    // Add two pairs
    fireEvent.change(p1, { target: { value: 'Alpha' } });
    fireEvent.change(p2, { target: { value: 'One' } });
    fireEvent.click(addBtn);

    fireEvent.change(p1, { target: { value: 'Beta' } });
    fireEvent.change(p2, { target: { value: 'Two' } });
    fireEvent.click(addBtn);

    // Verify initial order
    expect(screen.getByText('Alpha / One')).toBeDefined();
    expect(screen.getByText('Beta / Two')).toBeDefined();

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(2);

    const first = items[0];
    const second = items[1];

    // Minimal DataTransfer mock compatible with our handlers
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) {
        this.data[type] = val;
      },
      getData(type: string) {
        return this.data[type];
      },
      effectAllowed: 'move',
      dropEffect: 'move',
    } as unknown as DataTransfer;

    fireEvent.dragStart(first, { dataTransfer });
    fireEvent.dragOver(second, { dataTransfer });
    fireEvent.drop(second, { dataTransfer });
    fireEvent.dragEnd(first);

    // After drop, first item should now be the previously second pair
    const newItems = screen.getAllByRole('listitem');
    expect(newItems[0]).toHaveTextContent('Beta / Two');
  });
});
