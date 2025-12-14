

import { CoreManager } from './CoreManager';
import { BattleScene } from './Scene/BattleScene';
import type { ICard } from './interface/ICard';
import type { EnemyDefinition, PlayerDefinition } from './StatusData'; // 敵と味方の型をインポート

export class CardHandler {

  public ctx: CanvasRenderingContext2D;
  private manager: CoreManager;
  private battleScene: BattleScene;

  // カードの使用中は他の入力を無効化するフラグ（アニメーション考慮）
  public isProcessing: boolean = false;

  // 選択できるカード一覧（所持しているカードから選ばれたもの）
  private currentHand: ICard[] = [];

  constructor(ctx: CanvasRenderingContext2D, manager: CoreManager, battleScene: BattleScene) {
      this.ctx = ctx;
      this.manager = manager;
      this.battleScene = battleScene;
  }

    // CardRendererとつながりのないクラスなのでそれを繋ぐBattleSceneのためにgetterを用意
    public getCurrentHand(): ICard[] {
        return this.currentHand;
    }

    // 使用するカードのフロー処理
    public async executeTurnFlow(card: ICard, enemy: EnemyDefinition, players: PlayerDefinition[], id: number): Promise<void> {
        
        // カード処理中かをチェック
        if (this.isProcessing) return;
        this.isProcessing = true;

        // カードとシャッフルボタンを見えなくする
        this.reDrawCardEmpty();
        this.battleScene. teardownshuffleInput();
        
        // カード効果の反映
        await this.handleCardPlay(card, enemy, players, id);
        await this.manager.wait(1500);

        // 敵の生存チェック
        const isEnemyDie = this.checkEnemyHP(enemy, players);
        if (isEnemyDie) { // 戦闘終了フラグが立ったら、以降の処理をスキップして終了
            this.isProcessing = false;
            return; 
        }

        // 敵の行動ターン数を減らす
        enemy.nowTurn--;

        // 行動可能になったら
        if (enemy.nowTurn <= 0){

            // カード効果やメッセージが十分に表示されるよう待機
            await this.manager.wait(1000);
            this.manager.setMessage(`敵のターン！`);
            await this.manager.wait(2000);
            
            // 敵の行動ターンを進める、行動するかもチェック
            await this.countEnemyTurn(enemy, players);
            await this.manager.wait(2000);
        }
        
        // パーティの生存チェック
        const isPartyDie = this.checkPartyHP(enemy, players);
        if (isPartyDie) { // 戦闘終了フラグが立ったら、以降の処理をスキップして終了
            this.isProcessing = false;
            return; 
        }

        // 敵の生存チェック(自滅確認)
        const isEnemySelfDie = this.checkEnemyHP(enemy, players);
        if (isEnemySelfDie) {
            this.isProcessing = false;
            return; 
        }

        // カードを再ドローしてシャッフルボタンも復活
        this.resetCard();
        this.battleScene. setupInput();

        // 次のターンになりプレイヤーの状態変化
        this.addTurnNum();

        this.isProcessing = false;
    }

    // カードを視覚的に削除する
    public reDrawCardEmpty() {

        // 使用処理走るのでcurrentHandをもう空にして手札クリア
        this.currentHand = [];
        
        // カードを削除した後、即座に手札が消えたように描画を更新
        this.battleScene.updateHandDisplay(this.currentHand);
    }

    // カードの効果を呼ぶ
    public async handleCardPlay(card: ICard, enemy: EnemyDefinition, players: PlayerDefinition[], id: number): Promise<void> {       
        
        // カードのデータをHandlerに送る
        await card.execute(players, enemy, id, this.manager);
    }

    
    // 敵が死亡しているかチェック
    public checkEnemyHP(enemy: EnemyDefinition, players: PlayerDefinition[]): boolean {
        
        if (enemy.hp <= 0) {

            // テキストウィンドウに勝利メッセージを
            this.manager.setMessage(`${enemy.name} を倒した`)

            // プレイヤーのターンも経過させとく
            this.addTurnNum();

            // 勝利後のシーン遷移ボタンを表示、シャッフルボタンは消す
            this.battleScene.setupContinueInput();
            this.battleScene.teardownshuffleInput();
            
            // 内部のデータも更新させてから
            this.manager.EXP += enemy.exp;
            this.manager.GOLD += enemy.gold;

            // 再描画を依頼 (HPで画像更新分岐させてるので)
            this.manager.redrawActiveScene();

            // 描画を更新されてから経験値とゴールド付与を視覚化
            this.battleScene.battleWinUI();

            return true;
        }

        return false; // まだ試合は続く…
    }

    // プレイヤーが全滅しているかチェック
    public checkPartyHP(enemy: EnemyDefinition, players: PlayerDefinition[]): boolean {

        const isPartyWiped = players.every(p => p.hp <= 0);
        if (isPartyWiped) {

            // テキストウィンドウに敗北メッセージを
            this.manager.setMessage(`全滅した…`);

            // 画面の再描画を依頼 (boolで画像更新分岐させてるので)
            this.battleScene.isPartyWiped = true;
            this.manager.redrawActiveScene();

            // リザルトボタンを表示
            this.battleScene.setupFinishInput(); 
            return true;
        }

        return false; // まだ試合は続く…
    }


    // 敵の攻撃処理
    public async countEnemyTurn(enemy: EnemyDefinition, players: PlayerDefinition[]): Promise<void> {

            // 0から99までのランダムな整数を生成
            const rand = Math.floor(Math.random() * 100);

            // 半分の割合で通常技か特殊技を使用
            if (rand < 50) {
                await enemy.Special(players, this.manager);
            } 
            else {
                await enemy.Attack(players, this.manager);
            }

            // 再リロード
            enemy.nowTurn = enemy.moveTurn;
    }

    // 新たなターンを迎える時の準備
    public resetCard(): void {

        console.log(`--- New Turn ---`);

        // カードを再抽選して手札に格納
        this.drawNewHand();
        
        // BattleSceneに対して、新しい手札の描画を要求
        this.battleScene.updateHandDisplay(this.currentHand);
        
        // 画面の再描画をマネージャーに依頼
        this.manager.redrawActiveScene();
    }

    public addTurnNum(): void {

        // プレイヤーの情報を取得して…
        const players = this.manager.getAllPlayerDefinitions();
        
        // 1ターン経過による状態変化を反映
        players.forEach(player => {
            
            // invincibleが0より大きい場合1減らす
            if (player.invincible > 0) {
                player.invincible--;
                this.manager.redrawActiveScene();
            }

            // targetが0より大きい場合1減らす
            /*
            if (player.target > 0) {
                player.target--;
                this.manager.redrawActiveScene();
            }
            */
        });
    }

    // 所持カードの中からランダムかつ重複なしで選び、手札として設定する
    public drawNewHand(): ICard[] {

        // 所持カードのリスト、使用可能な手札枚数値を取得
        const inventory = this.manager.getInventoryCards();
        const handSize = this.manager.handSize;

        if (inventory.length === 0) {
            console.warn("所持カードがありません。ドローをスキップします。");
            this.currentHand = [];
            return this.currentHand;
        }

        // シャッフルして先頭から3枚選ぶ(インベントリをコピーしてシャッフル用の配列を作成)
        const shuffled = [...inventory];

        // フィッシャー・イェーツ（Fisher-Yates）アルゴリズムでシャッフル
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 必要な枚数だけ手札として取り出す
        this.currentHand = shuffled.slice(0, handSize);

        return this.currentHand;
    }
}