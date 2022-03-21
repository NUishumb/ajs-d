import GameController from '../GameController';

describe('Game Controller', () => {
  const game = new GameController();

  it('getIndex() returns values correctly', () => {
    const received = game.getIndex(5, 4);
    expect(received).toBe(28);
  });

  it('getCoordinates() returns values correctly', () => {
    const received = game.getCoordinates(28);
    expect(received).toEqual({ x: 5, y: 4 });
  });
});
