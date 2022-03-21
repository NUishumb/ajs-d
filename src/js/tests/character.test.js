import Character from '../Character';
import Daemon from '../characters/Daemon';

test('should not allow creation of new Character()', () => {
  expect(() => new Character()).toThrow('new Character() creation is not allowed');
});

test('should create new character', () => {
  expect(new Daemon(1).type).toBe('daemon');
});
