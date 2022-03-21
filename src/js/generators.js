/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import PositionedCharacter from './PositionedCharacter';

export function* characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  const lvl = Math.ceil(Math.random() * maxLevel);
  const idx = Math.floor(Math.random() * allowedTypes.length);
  yield new allowedTypes[idx](lvl);
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  // TODO: write logic here
  const result = [];
  for (let i = 0; i < characterCount; i += 1) {
    result.push(characterGenerator(allowedTypes, maxLevel).next().value);
  }
  return result;
}

export function generatePlayerCell() {
  const allowedCells = [
    0, 1, 8, 9, 16, 17, 24, 25,
    32, 33, 40, 41, 48, 49, 56,
    57,
  ];

  return allowedCells[Math.floor(Math.random() * allowedCells.length)];
}

export function generateAiCell() {
  const allowedCells = [
    6, 7, 14, 15, 22, 23, 30, 31,
    38, 39, 46, 47, 54, 55, 62,
    63,
  ];

  return allowedCells[Math.floor(Math.random() * allowedCells.length)];
}

export function generatePositionedTeam(allowedTypes, maxLevel, characterCount) {
  const result = [];
  const positions = new Set();

  while (positions.size < characterCount) {
    positions.add(generatePlayerCell());
  }

  for (let i = 0; i < characterCount; i += 1) {
    const pos = [...positions];
    const char = characterGenerator(allowedTypes, maxLevel).next().value;
    const positioned = new PositionedCharacter(char, pos[i]);
    result.push(positioned);
  }
  return result;
}

export function generateAiTeam(allowedTypes, maxLevel, characterCount) {
  const result = [];
  const positions = new Set();

  while (positions.size < characterCount) {
    positions.add(generateAiCell());
  }

  for (let i = 0; i < characterCount; i += 1) {
    const pos = [...positions];
    const char = characterGenerator(allowedTypes, maxLevel).next().value;
    const positioned = new PositionedCharacter(char, pos[i]);
    result.push(positioned);
  }
  return result;
}

export function generateStarterTeam() {
  const positions = new Set();
  const characterCount = 2;

  while (positions.size < characterCount) {
    positions.add(generatePlayerCell());
  }

  const pos = [...positions];
  return [
    new PositionedCharacter(new Swordsman(1), pos[0]),
    new PositionedCharacter(new Bowman(1), pos[1]),
  ];
}
