import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TournamentApp from '../TournamentApp';
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
});
