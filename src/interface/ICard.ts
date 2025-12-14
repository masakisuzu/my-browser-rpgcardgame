

import { CoreManager } from '../CoreManager';
import type { EnemyDefinition, PlayerDefinition } from '../StatusData';

export interface ICard {

  name: string; // 名称（効果名も兼ねている）
  id: number

  iconImg: string; // カードを識別するためのキー (CoreManager.tsのassetsキーと対応させる)
  cost: number;

  isTargetAll: boolean;
  
  execute: (
      players: PlayerDefinition[],
      enemy: EnemyDefinition,
      id: number,
      manager: CoreManager
  ) => void;
}