export default class GameState {
  static from(object) {
    Object.keys(object).forEach((e) => {
      this[e] = object[e];
      if (e === 'points') {
        if (this.maxPoints === undefined) {
          this.maxPoints = object[e];
        } else if (object[e] > this.maxPoints) {
          this.maxPoints = object[e];
        }
      }
    });

    return null;
  }
}
