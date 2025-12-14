
import type { CoreManager } from '../CoreManager';
import type { EnemyDefinition, PlayerDefinition } from '../StatusData';

export interface IPlayerStatus {
  name: string;
  id: number;

  hp: number;
  maxhp: number;
  basehp: number;
  atk: number;
  baseatk: number;
  invincible: number;
  target: number;

  Attack(enemy: EnemyDefinition, manager: CoreManager): void;
  Special(enemy: EnemyDefinition, manager: CoreManager, players: PlayerDefinition[]): void;
  
  image: string;
}