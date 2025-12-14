
import type { CoreManager } from '../CoreManager';
import type { PlayerDefinition } from '../StatusData';

export interface IEnemyStatus {
  name: string;
  id: number;

  hp: number;
  maxhp: number;
  atk: number;
  Attack(players: PlayerDefinition[], manager: CoreManager): void;
  Special(players: PlayerDefinition[], manager: CoreManager): void;

  exp: number;
  gold: number,
  nowTurn: number;
  moveTurn: number;

  stage: string;
  critical: number; // 一撃必殺技を受ける確率

  image: string;
  positionX: number; // 敵毎にサイズ異なるから仕方なく一つ一つ設定します。
  positionY: number;
  sizeX: number;
  sizeY: number;
}