import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TournamentApp from '../TournamentApp';

describe('TournamentApp', () => {
  it('renders the tournament title', () => {
    render(<TournamentApp />);
    expect(screen.getByText(/TORNEO DE MUS/i)).toBeDefined();
  });

  it('renders pair entry inputs', () => {
    render(<TournamentApp />);
    expect(screen.getByPlaceholderText(/jugador 1/i)).toBeDefined();
  });

  it('renders the create tournament button', () => {
    render(<TournamentApp />);
    expect(screen.getByText(/crear torneo/i)).toBeDefined();
  });
});
