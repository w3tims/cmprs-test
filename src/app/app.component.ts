import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {CellState} from '../types/cell-state.enum';
import {BehaviorSubject, combineLatest, interval, Observable, Subscription} from 'rxjs';
import {filter, map, startWith, takeUntil, tap} from 'rxjs/operators';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {gameRules} from './game-rules';
import {Player} from '../types/player.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  boardSize = gameRules.boardSize;
  turnTimeMs = new FormControl(
    gameRules.defaultTurnTime,
    [
      Validators.required,
      Validators.min(1)
    ]
  );

  startGameForm = new FormGroup({
    turnTimeMs: this.turnTimeMs,
  });

  interval: Observable<number>;
  intervalSubscription: Subscription;

  cells$: BehaviorSubject<CellState[]> = new BehaviorSubject(
    this.getEmptyBoard(gameRules.boardSize)
  );
  userScore$ = new BehaviorSubject(0);
  cpuScore$ = new BehaviorSubject(0);

  targetCellIndex: number = null;

  userWon$: Observable<boolean> = this.userScore$
    .pipe(
      map(score => score >= gameRules.cellsToWin),
      filter(val => Boolean(val)),
    );

  cpuWon$: Observable<boolean> = this.cpuScore$
    .pipe(
      map(score => score >= gameRules.cellsToWin),
      filter(val => Boolean(val)),
    );

  someoneWon$: Observable<Player> = combineLatest([
    this.userWon$.pipe(startWith(false)),
    this.cpuWon$.pipe(startWith(false)),
  ]).pipe(
    filter(([userWon, cpuWon]) => userWon || cpuWon),
    map(([userWon, cpuWon]) => {
        if (userWon) {
          return Player.USER;
        }
        if (cpuWon) {
          return Player.CPU;
        }
      }),
  );

  constructor() {}

  startGameFormSubmit() {
    if (this.startGameForm.invalid) { return; }
    this.startGame();
  }


  startGame() {
    this.setupGame();
    this.intervalSubscription?.unsubscribe();
    this.intervalSubscription = this.interval.subscribe();
  }


  setupGame() {
    this.clearBoard();
    this.userScore$.next(0);
    this.cpuScore$.next(0);
    this.targetCellIndex = null;
    this.interval = interval(this.turnTimeMs.value)
      .pipe(
        tap(() => this.markTargetAsFailed()),
        tap(() => this.markRandomEmptyCellAsTarget()),
        takeUntil(this.someoneWon$),
      );
  }

  clearBoard() {
    const cells = new Array(gameRules.boardSize ** 2);
    cells.fill(CellState.EMPTY);
    this.cells$.next(cells);
  }

  arrayFromNumber(num: number) {
    return new Array(num);
  }

  cellClick(cellNumber: number) {
    const cells = this.cells$?.value;
    if (cells[cellNumber] === CellState.TARGET) {
      cells[cellNumber] = CellState.CLICKED;
      this.targetCellIndex = null;
      this.userScore$.next(this.userScore$.value + 1);
    }
  }

  ngOnDestroy(): void {
    this.intervalSubscription?.unsubscribe();
  }

  getEmptyBoard(size: number): CellState.EMPTY[] {
    const cells = new Array(size ** 2);
    cells.fill(CellState.EMPTY);
    return cells;
  }

  markRandomEmptyCellAsTarget() {
    const cells = this.cells$?.value;
    const emptyCellsIndexes: number[] = this.cells$?.value?.reduce(
      (indexes, currentValue, currentIndex) => {
        if (currentValue === CellState.EMPTY) {
          return [ ...indexes, currentIndex];
        } else {
          return indexes; // not necessary?
        }
      }, []);
    const targetCellIndex = this.getRandomArrayElement(emptyCellsIndexes);
    cells[targetCellIndex] = CellState.TARGET;
    this.targetCellIndex = targetCellIndex;
    this.cells$.next(cells);
  }

  markTargetAsFailed() {
    if (this.targetCellIndex !== null) {
      const cells = this.cells$?.value;
      cells[this.targetCellIndex] = CellState.FAILED;
      this.cells$.next(cells);
      this.cpuScore$.next(this.cpuScore$.value + 1);
    }
  }

  // from 0 including  -  to 'max' excluding
  getRandomNumber(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  getRandomArrayElement(arr: any[]) {
    const arrLength = arr?.length;
    if (!arrLength) { return null; }
    const randomElementIndex = this.getRandomNumber(arrLength);
    return arr[randomElementIndex];
  }
}
