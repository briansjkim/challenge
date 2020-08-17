import { GameBoardItemType, KeyToGameDirection, GameDirectionMap, GameDirectionToKeys, GameDirection, pillMax, GameDirectionReverseMap } from '../Map';
import Item from './Item';

class Pacman extends Item implements GameBoardItem {

  type:GameBoardItemType = GameBoardItemType.PACMAN;

  desiredMove: string | false = false;
  grabBiscuit: string | false = false;

  score:number = 0;

  constructor(piece:GameBoardPiece, items:GameBoardItem[][], pillTimer:GameBoardItemTimer) {
    super(piece, items, pillTimer);

    // Bind context for callback events
    this.handleKeyPress = this.handleKeyPress.bind(this);

    // Add a listener for keypresses for this object
    window.addEventListener('keypress', this.handleKeyPress, false);

  }

  /**
   * Handle a keypress from the keyboard
   * 
   * @method handleKeyPress
   * @param {KeyboardEvent} e Input event
   */
  handleKeyPress(e: KeyboardEvent): void {

    if (KeyToGameDirection[e.key.toUpperCase()]) {
      this.desiredMove = KeyToGameDirection[e.key.toUpperCase()];
    }

  }
  
  /**
   * Returns the next move from the keyboard input
   * 
   * @method getNextMove
   * @return {GameBoardItemMove | boolean} Next move
   */
  getNextMove(): GameBoardItemMove | boolean {

    const { moves } = this.piece;
    let dangerFound: boolean = false;
    let goBackwards: GameBoardPiece = this.piece;
    let directionBackwards: string = GameDirectionMap[this.direction];

    // if Pacman grabbed a biscuit, attack the ghost until the timer runs out
    let biscuitGrabbed: boolean = false;

    const changeMoves: GameBoardItemMoves = {};

    let move: GameBoardItemMove | false = false;
    for (let i in moves) {
      if (i) {
        let move = moves[i];
        if (this.items[move.y][move.x].type !== GameBoardItemType.GHOST) {
          // looking for ghost in its current direction
          let ghost = this.findItem(i, GameBoardItemType.GHOST);
          // looking for biscuit in its current direction
          let biscuit = this.findItem(i, GameBoardItemType.BISCUIT);

          // if ghost is found
          if (ghost) {
            dangerFound = true;
          }

          // if biscuit is found
          if (biscuit) {
            // grab it by setting the biscuit to the current index
            this.grabBiscuit = i;
            // then move pacman to that index
            return { piece: move, direction: GameDirectionMap[i] }
          }

          // if pacman grabbed a biscuit and there is a ghost, move towards it
          if (ghost && biscuitGrabbed) {
            return { piece: move, direction: GameDirectionMap[i] }
          }

          // if there aren't any ghosts, move pacman to it
          if (!dangerFound && GameDirectionMap[GameDirectionReverseMap[i]] !== this.direction) {
            changeMoves[i] = move;
          } else if (GameDirectionMap[GameDirectionReverseMap[i]] === this.direction) {
            // if a biscuit isn't there, go the other direction
            goBackwards = move;
            directionBackwards = i;
          }
        }
      }
    }

    // if a ghost is found, go the opposite direction
    if (dangerFound) {
      changeMoves[directionBackwards] = goBackwards;
    }

    const changedMoveIdx = Object.keys(changeMoves);

    if (changedMoveIdx.length < 1) {
      return false;
    }

    const movePacman = Math.floor(Math.random() * changedMoveIdx.length);
    return { piece: changeMoves[changedMoveIdx[movePacman]], direction: GameDirectionMap[changedMoveIdx[movePacman]]}

  }
  /**
   * Move Pacman and "eat" the item
   * 
   * @method move
   * @param {GameBoardPiece} piece 
   * @param {GameDirection} direction 
   */
  move(piece: GameBoardPiece, direction: GameDirection):void {

    const item = this.items[piece.y][piece.x];
    if (typeof item !== 'undefined') {
      this.score += item.type;
      switch(item.type) {
        case GameBoardItemType.PILL:
          this.pillTimer.timer = pillMax;
          break;
        case GameBoardItemType.GHOST:
          if (typeof item.gotoTimeout !== 'undefined')
            item.gotoTimeout();
          break;
        default: break;
      }
    }
    this.setBackgroundItem({ type: GameBoardItemType.EMPTY });
    this.fillBackgroundItem();

    this.setPiece(piece, direction);
    this.items[piece.y][piece.x] = this;
  }

}

export default Pacman;