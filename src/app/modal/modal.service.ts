import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';

import {ModalComponent} from './modal.component';
import {Player} from '../../types/player.enum';

@Injectable({
  providedIn: 'root',
})
export class ModalService {

  constructor(
    public dialog: MatDialog,
  ) { }

  openResultModal(winner: Player) {
    this.dialog.open(ModalComponent, {data: {
      title: winner === Player.USER ? 'Победа' : 'Поражение',
      message: `победитель: ${winner === Player.USER ? 'Пользователь' : 'Компьютер'}`,
    }});
  }
}
