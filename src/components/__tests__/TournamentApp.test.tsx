import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TournamentApp from '../TournamentApp';
import * as tourLib from '../../lib/tournament';
import * as entropyLib from '../../lib/entropy';
import { DEFAULT_LANG, t } from '../../lib/i18n';

describe('TournamentApp', () => {
  it('renders the tournament title', () => {
    render(<TournamentApp />);
    expect(screen.getByText(t(DEFAULT_LANG, 'header.title'))).toBeDefined();
  });

  it('renders pair entry inputs', () => {
    render(<TournamentApp />);
    expect(screen.getByPlaceholderText(t(DEFAULT_LANG, 'addPair.placeholder1'))).toBeDefined();
  });

  it('renders the create tournament button', () => {
    render(<TournamentApp />);
    expect(screen.getByText(t(DEFAULT_LANG, 'create.label'))).toBeDefined();
  });

  it('shows Basque left-panel labels and entropy meter, and uses deriveSeed on create', () => {
    // force Basque language
    window.localStorage.setItem('museko:lang', 'eu');

    const spy = vi.spyOn(entropyLib, 'deriveSeed');
    spy.mockReturnValue(0x1234);

    render(<TournamentApp />);

    // Basque left panel pair-entry button/header present
    expect(screen.getAllByText(t('eu', 'addPair.addButton')).length).toBeGreaterThan(0);

    // Entropy meter title should appear
    expect(screen.getByText(t('eu', 'entropy.title'))).toBeDefined();

    // Add two pairs
    const p1 = screen.getByPlaceholderText(t('eu', 'addPair.placeholder1'));
    const p2 = screen.getByPlaceholderText(t('eu', 'addPair.placeholder2'));
    const addBtn = screen.getByRole('button', { name: t('eu', 'addPair.addButton') });

    fireEvent.change(p1, { target: { value: 'A' } });
    fireEvent.change(p2, { target: { value: 'B' } });
    fireEvent.click(addBtn);

    fireEvent.change(p1, { target: { value: 'C' } });
    fireEvent.change(p2, { target: { value: 'D' } });
    fireEvent.click(addBtn);

    // Create tournament - deriveSeed should be invoked
    const createBtn = screen.getByRole('button', { name: t('eu', 'create.label') });
    fireEvent.click(createBtn);
      expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
