
// 各シーンが共通してもつ機能（UnityC#に近づけたくて）
import { CoreManager } from '../CoreManager';

export interface IScene {

    // 描画用のコンテキストを保持
    ctx: CanvasRenderingContext2D; 

    // CoreManagerの参照を保持
    manager: CoreManager; 

    // シーンが開始されたときに一度だけ呼ばれる。UnityのStart()
    start(): void;

    // 描画処理。シーン切り替え時だけでなく、再描画を必要とする度に呼ばれる
    draw(): void;

    // 入力処理（DOMボタンのリスナー設定など）
    setupInput(): void;
    
    // シーンが終了するときに呼ばれる（リスナー解除など）
    // Unityと違ってシーンを切り替えると古いシーンのゲームオブジェクトが自動的に破棄されるようなことは起きないらしい
    teardownInput(): void;

}