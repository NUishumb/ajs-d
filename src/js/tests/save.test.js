import GameStateService from '../GameStateService';

describe('Save Test', () => {
  const gss = new GameStateService(localStorage);

  it('returns current level', () => {
    const toSave = {
      currentLevel: 2,
    };
    gss.save(toSave);
    expect(gss.load()).toEqual({ currentLevel: 2 });
  });

  it('returns current turn', () => {
    const toSave = {
      turn: 'ai',
    };
    gss.save(toSave);
    expect(gss.load()).toEqual({ turn: 'ai' });
  });

  it('throws error', () => {
    const gss2 = new GameStateService();
    expect(() => gss2.load()).toThrow('Invalid state');
  });
});
