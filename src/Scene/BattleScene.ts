
import { CoreManager } from '../CoreManager';
import { CardRenderer } from '../CardRenderer';
import { CardHandler } from '../CardHandler';
import type { ICard } from '../interface/ICard';
import type { IScene } from '../interface/IScene';
import type { EnemyDefinition, PlayerDefinition } from '../StatusData';

import { 
    PLAYER_STARTPOSITION_X, 
    PLAYER_STARTPOSITION_Y, 
    PLAYER_SIZE_X, 
    PLAYER_SIZE_Y, 
    PLAYER_SPACING,
} from '../BattleConstant';

export class BattleScene implements IScene {

    public isPartyWiped: boolean = false; // パーティの全滅フラグ
    private enemy: EnemyDefinition | undefined; // 今回エンカウンターした敵

    private cardRenderer: CardRenderer | undefined;
    private cardHandler: CardHandler | undefined;

    public ctx: CanvasRenderingContext2D;
    public manager: CoreManager; 

    constructor(ctx: CanvasRenderingContext2D, manager: CoreManager) {
        this.ctx = ctx;
        this.manager = manager;
    }

    public start(): void {
        
        // 全滅フラグもリセット
        this.isPartyWiped = false;

        // 今回バトルする敵をランダムで呼び出してくれる
        this.enemy = this.manager.getRandomEnemyDefinition();

        // Rendererの方からカードの使用信号を受け取りHandlerに渡していく
        this.cardHandler = new CardHandler(this.ctx, this.manager, this);

        // ドロー！選択可能カードの配列にカードを入れにいく
        this.cardHandler.drawNewHand();

        // シーン開始時にクラスをインスタンス化して、カード位置を初期化する
        this.cardRenderer = new CardRenderer(this.ctx, this.manager);
        this.cardRenderer.initializeCards(this.cardHandler.getCurrentHand()); // 新たな手札を渡す

        this.manager.setMessage(`${this.enemy?.name} が現れた！`);
        
        // 描画設定の初期化
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'black';
    }

    public draw(): void {
        this.ctx.clearRect(0, 0, 960, 540);
        this.SetUpStage();
        this.SetUpEnemy();
        this.SetUpParty();
        this.SetUpUI();
        this.cardRenderer?.draw();
        this.manager.drawMessage();
    }

    public SetUpStage(): void{

        // 敵の定義が存在することを確認(undefinedの可能性を考慮して型の絞り込み)
        if (this.enemy) {
            
            // 画像を取得
            const stageImage = this.manager.getImg(this.enemy.stage);
            
            // 画像の実体が存在することを確認したらようやく描画
            if (stageImage) {
                this.ctx.drawImage(stageImage, 0, 0, 960, 540);
            } 
            else {
                console.error(`ステージ画像が見つかりません: ${this.enemy.stage}`);
            }
        } 
        else {
            console.warn("エンカウントする敵がいません。");
        }
    }

    public SetUpParty(): void {

        // パーティーが全滅している場合は、何も描画せず終了
        if (this.isPartyWiped) {
            // 獲得したGOLDとEXPを表示
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillStyle = 'white';

            // やられても経験値は得られる設計
            if(this.enemy) {
                this.manager.EXP += this.enemy?.exp; 
                this.ctx.fillText(`+${this.enemy?.exp} オマケ`, 160, 475);
            }

            return;
        }

        const players: PlayerDefinition[] = this.manager.getAllPlayerDefinitions();
    
        for (let i = 0; i < players.length; i++) {
            
            // プレイヤーの情報
            const player = players[i];
            const playerImage = this.manager.getImg(player.image);
            const hakaImage = this.manager.getImg('hakaImg');
            const nowmutekiImage = this.manager.getImg('nowmutekiImg');
            
            if (playerImage && hakaImage && nowmutekiImage) {

                // 描画位置を調整: 最初のプレイヤーのX位置からずらして横に並べる
                const positionX = PLAYER_STARTPOSITION_X + i * PLAYER_SPACING; 
                const positionY = PLAYER_STARTPOSITION_Y;
                const sizeX = PLAYER_SIZE_X;
                const sizeY = PLAYER_SIZE_Y;

                // 影の描画
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;

                // プレイヤー画像を描画（HPが0以下の場合、見た目が墓になる）
                if (player.hp <= 0) 
                {
                    this.ctx.drawImage(hakaImage, positionX, positionY, sizeX, sizeY);
                }
                else
                {
                    this.ctx.drawImage(playerImage, positionX, positionY, sizeX, sizeY)

                    // 無敵の間、専用エフェクトも描画する
                    if (player.invincible > 0) {
                        this.ctx.globalAlpha = 0.4; // 透明なバリアになるように
                        this.ctx.drawImage(nowmutekiImage, positionX-5, positionY-5, sizeX + 15, sizeY + 15);
                        this.ctx.globalAlpha = 1.0;
                    }
                }

                // 情報を描画
                this.ctx.font = 'bold 20px sans-serif';
                
                this.ctx.fillStyle = 'lightgreen';
                this.ctx.fillText(`HP   ${player.hp} / ${player.maxhp}`, positionX, positionY - 30);
                
                this.ctx.fillStyle = 'red';
                this.ctx.fillText(`ATK ${player.atk}`, positionX, positionY - 10);

            } else {
                console.error(`プレイヤー画像が見つかりません: ${player.image}`);
            }
        }

    }

    public SetUpEnemy(): void {

        // 敵の定義が存在することを確認(undefinedの可能性を考慮して型の絞り込み)
        if (this.enemy) {

            // 画像を取得
            const enemyImage = this.manager.getImg(this.enemy.image);
            
            // 画像の実体が存在することを確認したらようやく描画
            if (enemyImage && this.enemy.hp > 0) {

                // 描画位置を調整
                const positionX = this.enemy.positionX; 
                const positionY = this.enemy.positionY;
                const sizeX = this.enemy.sizeX;
                const sizeY = this.enemy.sizeY;

                // 影の描画
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;

                // 敵の画像を描画
                this.ctx.drawImage(enemyImage, positionX, positionY, sizeX, sizeY);    
                
                // 情報を描画
                this.ctx.font = 'bold 35px sans-serif';
                this.ctx.textAlign = 'left';
                
                this.ctx.fillStyle = 'lightgreen';
                this.ctx.fillText(`HP   ${this.enemy.hp} / ${this.enemy.maxhp}`, 680, 180); 
                
                this.ctx.fillStyle = 'red';   
                this.ctx.fillText(`ATK ${this.enemy.atk}`, 680, 220);
                
                
                if (this.enemy.nowTurn == 0){
                    this.ctx.fillStyle = 'blue';
                }
                else {
                    this.ctx.fillStyle = 'white';
                }
                this.ctx.fillText(`残りターン ${this.enemy.nowTurn}`, 100, 190);
            } 
            else {
                console.error(`敵の情報が見つかりません: ${this.enemy.image}`);
            }
        } 
        else {
            console.warn("存在しない敵です。");
        }
    }

    public battleWinUI(){

        if (!this.enemy) return;

                // 獲得したGOLDとEXPを表示
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
                this.ctx.textAlign = 'left';
                this.ctx.font = 'bold 20px sans-serif';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(`+${this.enemy.exp}`, 160, 475);
                this.ctx.fillText(`+${this.enemy.gold}`, 160, 520);
    }

    public SetUpUI(): void {
        
        // 初期設定
        this.ctx.textAlign = 'left';
        this.ctx.strokeStyle = 'black';
        this.ctx.fillStyle = 'black';

            // テキストウィンドウ
            this.ctx.fillRect(5, 5, 755, 60);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(10, 10, 745, 50);

            // EXP&GOLDウィンドウ
            this.ctx.fillStyle = '#000000ff';
            this.ctx.fillRect(5, 425, 140, 110);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(10, 430, 130, 100);

            this.ctx.font = 'bold 20px sans-serif';
            this.ctx.fillStyle = '#ffffffff';
            
            this.ctx.fillText(`EXP`, 20, 455); 
            this.ctx.fillText(`${this.manager.EXP}`, 30, 475); 

            this.ctx.fillText(`GOLD`, 20, 500); 
            this.ctx.fillText(`${this.manager.GOLD}`, 30, 520); 

            // ラウンドウィンドウ
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 25px sans-serif';
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(770, 5, 180, 60);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(775, 10, 170, 50);
            this.ctx.fillStyle = '#ffffffff';
            this.ctx.fillText(`ステージ ${this.manager.roundSceneCount}`, 860, 46); 

            // シャッフルコスト
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 13px sans-serif';
            this.ctx.fillStyle = '#ffffffff';
            this.ctx.fillText(`-${this.manager.shuffleCost}G`, 100, 418);
    }


    // これが呼ばれたらカード効果のフローを開始
    public ExecuteCardFlow(card: ICard, id: number){

        // CardHandlerの処理に必要な情報を渡す
        if (this.cardHandler && this.enemy) {
            
            // プレイヤー（味方パーティ全体）の情報を取得
            const players = this.manager.getAllPlayerDefinitions();
            
            // CardHandlerにカード効果処理のフロー全体を委譲する
            // 「使用するカード」「敵」「プレイヤー達」を与える
            this.cardHandler.executeTurnFlow(card, this.enemy, players, id);
            
        } else {
            console.warn("CardHandlerが未初期化、または敵がいません。");
        }
    }

    // 初期化(Start())後にもまたカードを初期化したくなった時
    public updateHandDisplay(newHand: ICard[]): void {
        if (this.cardRenderer) {

            // CardRendererに新しい手札を渡して位置とデータを再設定
            this.cardRenderer.initializeCards(newHand);

            // BattleSceneのdraw()を呼び出し、再描画を確定させる
            this.manager.redrawActiveScene();

        } else {
            console.warn("CardRendererが未初期化です。手札を更新できません。");
        }
    }



    // カードドラッグ処理と再ドローの有効化（interfaceから呼ばれる）
    public setupInput(): void {

        const shuffleButton = document.getElementById('shuffle-button') as HTMLButtonElement;
        if (shuffleButton) {
            shuffleButton.addEventListener('click', this.shuffle);
        }
        shuffleButton.classList.remove('hidden'); 

        this.cardRenderer?.setupInput();
    }

    // 討伐時のボタン処理の有効化（interfaceではなく個別で呼ばれる形）
    public setupContinueInput(): void {

        const continueTripButton = document.getElementById('continueTrip-button') as HTMLButtonElement;
        if (continueTripButton) {
            continueTripButton.addEventListener('click', this.continueTrip);
        }
        continueTripButton.classList.remove('hidden'); 
    }

    // 全滅時のボタン処理の有効化（interfaceではなく個別で呼ばれる形）
    public setupFinishInput(): void {

        const finishTripButton = document.getElementById('finishTrip-button') as HTMLButtonElement;
        if (finishTripButton) {
            finishTripButton.addEventListener('click', this.finishTrip);
        }
        finishTripButton.classList.remove('hidden');
    }

    // ボタン機能の無効化
    public teardownInput(): void {

        const continueTripButton = document.getElementById('continueTrip-button') as HTMLButtonElement;
        if (continueTripButton) {
            continueTripButton.addEventListener('click', this.continueTrip);
        }

        const finishTripButton = document.getElementById('finishTrip-button') as HTMLButtonElement;
        if (finishTripButton) {
            finishTripButton.addEventListener('click', this.finishTrip);
        }

        const shuffleButton = document.getElementById('shuffle-button') as HTMLButtonElement;
        if (shuffleButton) {
            shuffleButton.addEventListener('click', this.shuffle);
        }

        finishTripButton.classList.add('hidden'); 
        continueTripButton.classList.add('hidden');
        shuffleButton.classList.add('hidden');
        
        this.cardRenderer?.teardownInput();
    }

    // シャッフルボタンの無効化（個別で呼びたい）
    public teardownshuffleInput(): void {

        const shuffleButton = document.getElementById('shuffle-button') as HTMLButtonElement;
        if (shuffleButton) {
            shuffleButton.addEventListener('click', this.shuffle);
        }
        
        shuffleButton.classList.add('hidden'); 
    }

    // ボタン処理（コールバック）
    private continueTrip = () => {
        this.manager.changeScene('Event');
    };

    private finishTrip = () => {
        this.manager.changeScene('Result');
    };

    private shuffle = () => {

        // お金を支払う
        this.manager.GOLD -= this.manager.shuffleCost;

        // お金がマイナスになったら…
        if (this.manager.GOLD < 0){

            // マイナスは表示しないように
            this.manager.GOLD = 0;

            // 勇者を描画させなくする分岐
            this.isPartyWiped = true;

            // やられても経験値は得られる設計
            if (this.enemy)
            this.manager.EXP += this.enemy.exp;

            // リザルトボタンを表示、シャッフルボタンは消す
            this.setupFinishInput();
            this.teardownshuffleInput();
            
            // 次の描画メッセージも予約して…
            this.manager.setMessage(`所持金が底を尽き 勇者たちも力尽きた…`);

            // カードを見えなくしつつ再描画
            this.cardHandler?.reDrawCardEmpty();

            return;
        }
        
        // コストも増える！！
        this.manager.shuffleCost += this.manager.shuffleCostBoost;

        // お金はまだ整数、つまり無事支払えたということで再ドローします
        this.cardHandler?.resetCard();
    };
    
}