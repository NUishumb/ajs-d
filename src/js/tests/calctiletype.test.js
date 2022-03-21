import { calcTileType } from '../utils';

describe('calcTileType', () => {
  it('returns center', () => {
    expect(calcTileType(33, 8)).toBe('center');
  });

  it('returns bottom', () => {
    expect(calcTileType(57, 8)).toBe('bottom');
  });

  it('returns top-right', () => {
    expect(calcTileType(7, 8)).toBe('top-right');
  });

  it('returns bottom-left', () => {
    expect(calcTileType(56, 8)).toBe('bottom-left');
  });

  it('returns right', () => {
    expect(calcTileType(15, 8)).toBe('right');
  });
});
