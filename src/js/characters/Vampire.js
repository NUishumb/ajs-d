import Character from '../Character';

export default class Vampire extends Character {
  constructor(level) {
    super();
    this.type = 'vampire';
    this.level = level;
    this.attack = 25;
    this.defence = 25;
  }
}
