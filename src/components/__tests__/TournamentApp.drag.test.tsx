import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('keeps placeholder when moving between children (enter counter prevents flicker)', () => {
    vi.useFakeTimers();
    render(<TournamentApp />);

    const p1 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder1'));
    const p2 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder2'));
    const addBtn = screen.getByRole('button', { name: t(DEFAULT_LANG, 'addPair.addButton') });

    // Add three pairs
    fireEvent.change(p1, { target: { value: 'A' } });
    fireEvent.change(p2, { target: { value: '1' } });
    fireEvent.click(addBtn);
    fireEvent.change(p1, { target: { value: 'B' } });
    fireEvent.change(p2, { target: { value: '2' } });
    fireEvent.click(addBtn);
    fireEvent.change(p1, { target: { value: 'C' } });
    fireEvent.change(p2, { target: { value: '3' } });
    fireEvent.click(addBtn);

    const items = screen.getAllByRole('listitem');
    const first = items[0];
    const second = items[1];
    const container = (second.parentElement && second.parentElement.parentElement) as HTMLElement;

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) { this.data[type] = val; },
      getData(type: string) { return this.data[type]; },
      effectAllowed: 'move',
      dropEffect: 'move',
    } as unknown as DataTransfer;

    // Enter container and item to increment enter counter
    fireEvent.dragEnter(container, { dataTransfer });
    fireEvent.dragStart(first, { dataTransfer });
    fireEvent.dragEnter(second, { dataTransfer });
    fireEvent.dragOver(second, { dataTransfer });

    // Placeholder should be present
    expect(screen.getByTestId('drag-placeholder')).toBeDefined();

    // Simulate a dragLeave on the item (nested), which should NOT clear placeholder
    fireEvent.dragLeave(second);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // placeholder should still exist because enter counter > 0
    expect(screen.getByTestId('drag-placeholder')).toBeDefined();

    // Now leave the container truly
    fireEvent.dragLeave(container);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // placeholder should be gone
    expect(screen.queryByTestId('drag-placeholder')).toBeNull();
    vi.useRealTimers();
  });

  it('clears placeholder after debounce when leaving container', () => {
    vi.useFakeTimers();
    render(<TournamentApp />);

    const p1 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder1'));
    const p2 = screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder2'));
    const addBtn = screen.getByRole('button', { name: t(DEFAULT_LANG, 'addPair.addButton') });

    // Add two pairs
    fireEvent.change(p1, { target: { value: 'X' } });
    fireEvent.change(p2, { target: { value: 'x' } });
    fireEvent.click(addBtn);
    fireEvent.change(p1, { target: { value: 'Y' } });
    fireEvent.change(p2, { target: { value: 'y' } });
    fireEvent.click(addBtn);

    const items = screen.getAllByRole('listitem');
    const first = items[0];
    const second = items[1];
    const container = (first.parentElement && first.parentElement.parentElement) as HTMLElement;

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, val: string) { this.data[type] = val; },
      getData(type: string) { return this.data[type]; },
      effectAllowed: 'move',
      dropEffect: 'move',
    } as unknown as DataTransfer;

    fireEvent.dragEnter(container, { dataTransfer });
    fireEvent.dragStart(first, { dataTransfer });
    // Hover the next item so a placeholder is created
    fireEvent.dragOver(second, { dataTransfer });

    expect(screen.getByTestId('drag-placeholder')).toBeDefined();

    // Leave container -> should clear after debounce
    fireEvent.dragLeave(container);
    act(() => {
      // less than debounce: still present
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByTestId('drag-placeholder')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId('drag-placeholder')).toBeNull();
    vi.useRealTimers();
  });
});
