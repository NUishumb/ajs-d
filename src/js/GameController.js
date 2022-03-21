import { generateAiTeam, generatePositionedTeam, generateStarterTeam } from './generators';
import Daemon from './characters/Daemon';
import Magician from './characters/Magician';
import Bowman from './characters/Bowman';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Swordsman from './characters/Swordsman';
import GameStateService from './GameStateService';
import GameState from './GameState';
import GamePlay from './GamePlay';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.playerTeam = {
      ...generateStarterTeam(),
    };
    this.aiTeam = {
      ...generateAiTeam([Daemon, Undead, Vampire], 1, 2),
    };
    this.playerTeam = Object.values(this.playerTeam);
    this.aiTeam = Object.values(this.aiTeam);
    this.turn = 'player';
    this.boardY = [
      0, 8, 16, 24, 32, 40, 48, 54, 62, 70,
    ];
    this.currentLevel = 1;
  }

  init() {
    this.gamePlay.drawUi('prairie');
    this.gamePlay.addCellEnterListener((idx) => this.onCellEnter(idx));
    this.gamePlay.addCellLeaveListener((idx) => this.onCellLeave(idx));
    this.gamePlay.addCellClickListener((idx) => this.onCellClick(idx));
    this.gamePlay.addNewGameListener(() => {
      this.newGame();
    });
    this.gamePlay.addSaveGameListener(() => {
      this.save();
    });
    this.gamePlay.addLoadGameListener(() => {
      this.load();
    });
    this.gamePlay.addCheatModeListener(() => {
      for (let i = 0; i < this.playerTeam.length; i += 1) {
        const char = this.playerTeam[i].character;
        this.playerTeam[i].moveRange = 8;
        char.defence = 999;
        char.attack = 999;
      }
    });

    this.combineTeams();
    this.gamePlay.redrawPositions(this.combinedTeams);

    this.initMoveRange();
  }

  onCellClick(index) {
    if (this.turn === 'ai') return;
    if (this.blockTheField === true) return;

    this.selectCharacter(index);

    this.alertOnSelect(index, this.aiTeam);

    // set coordinates after selecting character
    if (this.selectedCharacter) {
      if (this.playerCanMove(index) || this.selectedCharacter.x === undefined) {
        // attack if cell has enemy
        for (let i = 0; i < this.aiTeam.length; i += 1) {
          if (this.aiTeam[i].position === index) this.attack(index, this.aiTeam[i]);
        }
      }

      this.moveTo(index);
    }

    const randomAiIndex = Math.floor(Math.random() * this.aiTeam.length);
    setTimeout(() => this.aiTurn(this.aiTeam[randomAiIndex]), 1500);
  }

  onCellEnter(index) {
    if (this.turn === 'ai') return;
    if (this.blockTheField === true) return;

    this.showInfo(index);

    // if player can move on selected cell, show green circle
    if (this.playerCanMove(index)) {
      this.gamePlay.selectCell(index, 'green');
      this.gamePlay.setCursor('pointer');
    }

    // if player can attack selected cell, show red circle
    if (this.playerCanAttack(index)) {
      const targets = this.aiTeam;
      for (let i = 0; i < targets.length; i += 1) {
        if (targets[i].position === index) {
          this.gamePlay.selectCell(index, 'red');
          this.gamePlay.setCursor('crosshair');
        }
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor('default');

    // don't remove yellow circle of selected character
    if (this.selectedCharacter !== undefined) {
      if (this.selectedCharacter.position === index) {
        this.gamePlay.selectCell(index);
      } else {
        this.gamePlay.deselectCell(index);
      }
    }

    if (this.selectedCharacter === undefined) {
      this.gamePlay.deselectCell(index);
    }
  }

  selectCharacter(index) {
    const prev = this.previouslySelectedCell;

    const team = this.playerTeam;

    // if cell is occupied by friendly character, select that character
    for (let i = 0; i < team.length; i += 1) {
      if (team[i].position === index) {
        if (this.selectedCharacter) this.gamePlay.deselectCell(this.selectedCharacter.position);
        if (prev !== undefined) this.gamePlay.deselectCell(prev);
        this.gamePlay.selectCell(index);
        this.previouslySelectedCell = index;
        this.selectedCharacter = team[i];
      }
    }
  }

  showInfo(index) {
    const values = this.combinedTeams;

    // if there is a character on the cell, show info
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] && values[i].position === index) {
        this.gamePlay.setCursor('pointer');
        const c = values[i].character;
        this.gamePlay.showCellTooltip(`🎖${c.level}⚔${c.attack}🛡${c.defence}❤${c.health}`, index);
      }
    }
  }

  switchTurn() {
    switch (this.turn) {
      case 'player':
        this.turn = 'ai';
        break;
      case 'ai':
        this.turn = 'player';
        break;
      default:
        return null;
    }
    return null;
  }

  playerCanMove(index) {
    const team = this.playerTeam;
    for (let i = 0; i < team.length; i += 1) {
      if (team[i].position === index) {
        // return if attempting to move on occupied cell
        return false;
      }
    }

    if (this.selectedCharacter !== undefined && this.selectedCharacter.position !== index) {
      const { x, y } = this.getCoordinates(this.selectedCharacter.position);

      const minDistanceX = x - this.selectedCharacter.moveRange;
      const maxDistanceX = x + this.selectedCharacter.moveRange;
      const minDistanceY = y - this.selectedCharacter.moveRange;
      const maxDistanceY = y + this.selectedCharacter.moveRange;

      const res = this.getCoordinates(index);
      const boolX = res.x <= maxDistanceX && res.x >= minDistanceX;
      const boolY = res.y <= maxDistanceY && res.y >= minDistanceY;

      return boolX && boolY;
    }
    return false;
  }

  moveTo(index) {
    if (this.playerCanMove(index) && this.turn === 'player') {
      for (let i = 0; i < this.combinedTeams.length; i += 1) {
        if (this.combinedTeams[i].position === index) return;
      }

      this.switchTurn();

      this.gamePlay.deselectCell(this.selectedCharacter.position);
      this.selectedCharacter.position = index;
      this.gamePlay.redrawPositions(this.combinedTeams);
      this.gamePlay.selectCell(index);

      this.gamePlay.deselectCell(this.selectedCharacter.position);
      delete this.selectedCharacter;
    }
  }

  playerCanAttack(index) {
    if (this.selectedCharacter !== undefined && this.selectedCharacter.position !== index) {
      const { x, y } = this.getCoordinates(this.selectedCharacter.position);
      const minDistanceX = x - this.selectedCharacter.moveRange;
      const maxDistanceX = x + this.selectedCharacter.moveRange;
      const minDistanceY = y - this.selectedCharacter.moveRange;
      const maxDistanceY = y + this.selectedCharacter.moveRange;

      const res = this.getCoordinates(index);
      const boolX = res.x <= maxDistanceX && res.x >= minDistanceX;
      const boolY = res.y <= maxDistanceY && res.y >= minDistanceY;

      return boolX && boolY;
    }
    return false;
  }

  async attack(index, target) {
    if (this.playerCanAttack(index)) {
      const hero = this.selectedCharacter.character;
      const { character } = target;
      const dmg = Math.max(hero.attack - character.defence, hero.attack * 0.1);
      character.health -= dmg;
      await this.gamePlay.showDamage(index, dmg);
      this.checkIfTargetDied(target);
      this.combineTeams();
      this.gamePlay.redrawPositions(this.combinedTeams);
      this.switchTurn();

      this.gamePlay.deselectCell(target.position);
      this.gamePlay.deselectCell(this.selectedCharacter.position);
      delete this.selectedCharacter;

      this.checkIfGameOver();
    }
  }

  initMoveRange() {
    for (let i = 0; i < this.combinedTeams.length; i += 1) {
      const { type } = this.combinedTeams[i].character;
      if (type === 'magician' || type === 'daemon') {
        this.combinedTeams[i].moveRange = 1;
      } else if (type === 'bowman' || type === 'vampire') {
        this.combinedTeams[i].moveRange = 2;
      } else if (type === 'undead' || type === 'swordsman') {
        this.combinedTeams[i].moveRange = 4;
      }
    }
  }

  combineTeams() {
    this.combinedTeams = [...this.playerTeam, ...this.aiTeam];
  }

  getCoordinates(index) {
    const result = {};
    for (let i = 0; i < this.boardY.length; i += 1) {
      if (index >= this.boardY[i]
        && index < this.boardY[i + 1]) {
        if (index !== 54 && index !== 55
          && index !== 62 && index !== 63) result.y = i + 1;
        else result.y = i;

        if (index >= 8) result.x = (index % 8) + 1;
        else result.x = index + 1;
      }
    }
    return result;
  }

  checkIfTargetDied(target) {
    for (let i = 0; i < this.aiTeam.length; i += 1) {
      if (this.aiTeam[i].position === target.position) {
        if (this.aiTeam[i].character.health <= 0) {
          this.aiTeam.splice(i, 1);
          return;
        }
      }
    }

    for (let i = 0; i < this.playerTeam.length; i += 1) {
      if (this.playerTeam[i].position === target.position) {
        if (this.playerTeam[i].character.health <= 0) {
          this.playerTeam.splice(i, 1);
          return;
        }
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getIndex(x, y) {
    if (x <= 0) return null;
    if (y <= 0) return null;
    return ((y - 1) * 8) + x - 1;
  }

  alertOnSelect(index, enemy) {
    for (let i = 0; i < enemy.length; i += 1) {
      if (enemy[i].position === index && !this.selectedCharacter) {
        alert('Cannot select opponent\'s character');
      }
    }
  }

  generateAiNewPosition(bot) {
    if (bot && bot.position) {
      const { x, y } = this.getCoordinates(bot.position);
      const minDistanceX = x - bot.moveRange;
      const maxDistanceX = x + bot.moveRange;
      const minDistanceY = y - bot.moveRange;
      const maxDistanceY = y + bot.moveRange;

      const randomX = Math.floor(Math.random() * (maxDistanceX - minDistanceX + 1) + minDistanceX);
      const randomY = Math.floor(Math.random() * (maxDistanceY - minDistanceY + 1) + minDistanceY);

      const idx = this.getIndex(randomX, randomY);
      if (this.aiCanMove(bot, idx) === true) {
        return idx;
      }
    }
    return null;
  }

  aiCanMove(bot, index) {
    if (bot && bot.position) {
      const xy = this.getCoordinates(bot.position);

      const { x, y } = xy;
      const minDistanceX = x - bot.moveRange;
      const maxDistanceX = x + bot.moveRange;
      const minDistanceY = y - bot.moveRange;
      const maxDistanceY = y + bot.moveRange;

      const res = this.getCoordinates(index);
      if (res.x <= 0 || res.y <= 0
        || res.x >= 9 || res.y >= 9) return false;
      const boolX = res.x <= maxDistanceX && res.x >= minDistanceX;
      const boolY = res.y <= maxDistanceY && res.y >= minDistanceY;

      return boolX && boolY;
    }
    return false;
  }

  aiMoveTo(index) {
    this.selectedAi.position = index;
    this.gamePlay.redrawPositions(this.combinedTeams);
  }

  async aiAttack(bot, target) {
    const atk = await bot.character.attack;
    const dmg = Math.max(atk - target.character.defence, atk * 0.1);
    let attackTarget;

    for (let i = 0; i < this.playerTeam.length; i += 1) {
      if (this.playerTeam[i].position === target.position) {
        attackTarget = this.playerTeam[i];
        this.playerTeam[i].character.health -= dmg;
        break;
      }
    }

    await this.gamePlay.showDamage(await attackTarget.position, dmg);
    this.checkIfTargetDied(attackTarget);
    this.combineTeams();
    await this.gamePlay.redrawPositions(this.combinedTeams);
    this.checkIfGameOver();
  }

  aiTurn(bot) {
    if (this.callLimit === undefined) this.callLimit = 0;
    if (this.turn === 'player') return;
    if (this.callLimit >= 15) {
      this.callLimit = 0;
      this.switchTurn();
      return;
    }

    this.callLimit += 1;

    this.selectedAi = bot;

    let target;
    for (let i = 0; i < this.playerTeam.length; i += 1) {
      if (this.aiCanMove(bot, this.playerTeam[i].position)) {
        target = this.playerTeam[i];
        this.aiAttack(bot, target);
        this.switchTurn();
        this.callLimit = 0;
        return;
      }
    }

    const newPos = this.generateAiNewPosition(bot);
    for (let i = 0; i < this.combinedTeams.length; i += 1) {
      if (this.combinedTeams[i].position === newPos) {
        this.aiTurn(bot);
        return;
      }
    }

    // if ai can't attack, perform movement instead
    if (newPos !== null && this.aiCanMove(bot, newPos)) {
      this.aiMoveTo(newPos);
      this.switchTurn();
      this.callLimit = 0;
      return;
    }

    this.aiTurn(bot);
  }

  levelUp() {
    for (let i = 0; i < this.playerTeam.length; i += 1) {
      const char = this.playerTeam[i].character;
      char.level += 1;
      const newAttack = Math.max(char.attack, (char.attack * (1.8 - char.health)) / 100);
      char.health += 80;
      if (char.health > 100) char.health = 100;
      char.attack = newAttack;
      this.gamePlay.redrawPositions(this.combinedTeams);
    }
  }

  checkIfGameOver() {
    if (this.aiTeam.length === 0) {
      if (this.currentLevel === 1) {
        this.gamePlay.drawUi('desert');
        this.currentLevel = 2;

        const newMembers = generatePositionedTeam([Swordsman, Bowman, Magician], 1, 1);
        this.playerTeam.push(...newMembers);

        this.aiTeam = generateAiTeam([Daemon, Undead, Vampire], 2, this.playerTeam.length);
        this.aiTeam = Object.values(this.aiTeam);
        this.combineTeams();
        this.gamePlay.redrawPositions(this.combinedTeams);
        this.initMoveRange();

        this.levelUp();
      } else if (this.currentLevel === 2) {
        this.gamePlay.drawUi('arctic');
        this.currentLevel = 3;

        const newMembers = generatePositionedTeam([Swordsman, Bowman, Magician], 2, 2);
        this.playerTeam.push(...newMembers);

        this.aiTeam = generateAiTeam([Daemon, Undead, Vampire], 4, this.playerTeam.length);
        this.aiTeam = Object.values(this.aiTeam);
        this.combineTeams();
        this.gamePlay.redrawPositions(this.combinedTeams);
        this.initMoveRange();

        this.levelUp();
      } else if (this.currentLevel === 3) {
        this.gamePlay.drawUi('mountain');
        this.currentLevel = 4;

        const newMembers = generatePositionedTeam([Swordsman, Bowman, Magician], 2, 2);
        this.playerTeam.push(...newMembers);

        this.aiTeam = generateAiTeam([Daemon, Undead, Vampire], 4, this.playerTeam.length);
        this.aiTeam = Object.values(this.aiTeam);
        this.combineTeams();
        this.gamePlay.redrawPositions(this.combinedTeams);
        this.initMoveRange();

        this.levelUp();
      } else if (this.currentLevel === 4) {
        this.blockTheField = true;
        this.calculatePoints();
        GameState.from({ points: this.points });
      }
    } else if (this.playerTeam.length === 0) {
      this.blockTheField = true;
      this.points = 0;
    }
  }

  calculatePoints() {
    let sumHealth = 0;
    for (let i = 0; i < this.playerTeam.length; i += 1) {
      sumHealth += this.playerTeam[i].character.health;
    }
    this.points = sumHealth;
  }

  // eslint-disable-next-line class-methods-use-this
  newGame() {
    const gss = new GameStateService(localStorage);
    const gp = new GamePlay();
    gp.bindToDOM(document.querySelector('#game-container'));
    const gameCtrl = new GameController(gp, gss);
    gameCtrl.init();
  }

  save() {
    const toSave = {
      currentLevel: this.currentLevel,
      turn: this.turn,
      playerTeam: this.playerTeam,
      aiTeam: this.aiTeam,
    };
    const gss = new GameStateService(localStorage);
    gss.save(toSave);
    GameState.from(toSave);
  }

  load() {
    const gss = new GameStateService(localStorage);
    GameState.from(gss.load());

    this.newGame();

    this.checkUiToDraw(GameState.currentLevel);
    this.playerTeam = GameState.playerTeam;
    this.aiTeam = GameState.aiTeam;
    this.currentLevel = GameState.currentLevel;
    this.combineTeams();
    this.gamePlay.redrawPositions(this.combinedTeams);
  }

  checkUiToDraw(level) {
    if (level === 1) {
      this.gamePlay.drawUi('prairie');
    } else if (level === 2) {
      this.gamePlay.drawUi('desert');
    } else if (level === 3) {
      this.gamePlay.drawUi('arctic');
    } else if (level === 4) {
      this.gamePlay.drawUi('mountain');
    }
  }
}
