
import type { IScene } from '../interface/IScene'; 
import { CoreManager } from '../CoreManager';

import type { ICard } from '../interface/ICard';
import { 
    CARD_WIDTH,
    CARD_HEIGHT,
} from '../BattleConstant';

export class EventScene implements IScene {

    // ISceneインターフェースのプロパティを実装
    public ctx: CanvasRenderingContext2D;
    public manager: CoreManager;

    constructor(ctx: CanvasRenderingContext2D, manager: CoreManager) {
        this.ctx = ctx;
        this.manager = manager;
    }

    // Unityの Start() に相当
    public start(): void {

        // 戦闘シーンは勝ち負けが分岐するため、ここで数値を増やした方がわかりやすい
        this.manager.roundSceneCount++;

        // 僧侶Exによって減らされてる可能性あり
        this.manager.handSize = 4;

        // 一回目すなわち旅の前は色んなデータのリセットを
        if (this.manager.roundSceneCount <= 1){

            // EXPがGOLDに換算。無一文は避けるため最低限持たせとく
            this.manager.GOLD = (this.manager.EXP * 10) + 2000;

            // パーティのステータスを初期化
            this.manager.resetPlayerStatus(); 

            // 手持ちのカードも初期化
            this.manager.initializeInventory();
        }
    }

    // 描画処理、分岐フローチャート
    public draw(): void {

        // 前のシーンにあった描画を全て消す
        this.ctx.clearRect(0, 0, 960, 540);
        
        // イベント用の背景画像
        const stageImage = this.manager.getImg('eventImg');

        // 存在チェックして背景描画
        if (stageImage) this.ctx.drawImage(stageImage, 0, 0, 960, 540);
        
        // 最初は遊び方と換金説明、以降アイテムゲットや特技の説明
        if (this.manager.roundSceneCount <= 1)
        {
            this.showTutorial();
        }
        else
        {
                this.ctx.font = 'bold 50px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = '#FFD700'; // テキストの色を金色に
                this.ctx.shadowColor = 'black'; // 影の色
                this.ctx.shadowBlur = 5;        // 影のぼかし具合
                this.ctx.shadowOffsetX = 2;     // 影のXオフセット
                this.ctx.shadowOffsetY = 2;     // 影のYオフセット
                this.ctx.fillText("旅の途中", 480, 80);

                // 0から99までのランダムな整数を生成
                const rand = Math.floor(Math.random() * 100);

                // 15%ずつでキャラクターの特技説明、残りの40%でカード獲得（全部持ってたらGOLD）
                if (rand < 15) {
                    this.showWarriorSpecial();
                } 
                else if (rand < 30) {
                    this.showMageSpecial();
                }
                else if (rand < 45) {
                    this.showClericSpecial();
                }
                else if (rand < 60) {
                    this.showThiefSpecial();
                }
                else 
                {
                    // カード抽選（常に持ってたらnull）
                    const acquiredCard = this.manager.acquireRandomNewCard();

                    if (acquiredCard) { // 未所持のカードなら手に入れたカードを描画
                        this.drawSingleCard(acquiredCard, 390, 240);
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText("イイものゲット！", 480, 200);
                    } 
                    else // すでに持ってる（null）なら
                    {
                        this.showObtainGold();
                    }
                }
        }
    }

    private showWarriorSpecial(): void {

                    // 画像を取得して…
                    const warriorImage = this.manager.getImg('warriorImg');
                    
                    if (warriorImage) 
                    {
                        this.ctx.drawImage(warriorImage, 170, 200, 130, 130);

                        // 影の設定
                        this.ctx.shadowColor = 'black';
                        this.ctx.shadowBlur = 5;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;

                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.textAlign = 'center';
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText(`【戦士のとくぎ】`, 480, 200); 

                        this.ctx.fillStyle = 'white';
                        this.ctx.textAlign = 'left';
                        this.ctx.font = 'bold 25px sans-serif';
                        this.ctx.fillText(`2ターンみんなを無敵にする`, 350, 265); 
                        this.ctx.fillText(`効果は重ね掛け可能！`, 350, 300); 
                    }
    }

    private showMageSpecial(): void {

                    const mageImage = this.manager.getImg('mageImg');
                    
                    if (mageImage) 
                    {
                        this.ctx.drawImage(mageImage, 170, 200, 130, 130);

                        // 影の設定
                        this.ctx.shadowColor = 'black';
                        this.ctx.shadowBlur = 5;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;

                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.textAlign = 'center';
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText(`【魔導士のとくぎ】`, 480, 200); 

                        this.ctx.fillStyle = 'white';
                        this.ctx.textAlign = 'left';
                        this.ctx.font = 'bold 25px sans-serif';
                        this.ctx.fillText(`自身のATKを3倍したダメージを与える！`, 350, 265); 
                        this.ctx.fillText(`強力だが、シャッフルコストが増えてしまう`, 350, 300); 
                    }
    }

    private showClericSpecial(): void {

                    const clericImage = this.manager.getImg('clericImg');
                    
                    if (clericImage) 
                    {
                        this.ctx.drawImage(clericImage, 170, 200, 130, 130);

                        // 影の設定
                        this.ctx.shadowColor = 'black';
                        this.ctx.shadowBlur = 5;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;

                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.textAlign = 'center';
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText(`【僧侶のとくぎ】`, 480, 200); 

                        this.ctx.fillStyle = 'white';
                        this.ctx.textAlign = 'left';
                        this.ctx.font = 'bold 25px sans-serif';
                        this.ctx.fillText(`HP回復！ 上限HP突破！ ATKも増加！`, 350, 265); 
                        this.ctx.fillText(`さらに、倒れた仲間も復活`, 350, 300);
                    }
    }

    private showThiefSpecial(): void {

                    const thiefImage = this.manager.getImg('thiefImg');
                    
                    if (thiefImage) 
                    {
                        this.ctx.drawImage(thiefImage, 170, 200, 130, 130);

                        // 影の設定
                        this.ctx.shadowColor = 'black';
                        this.ctx.shadowBlur = 5;
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;

                        this.ctx.fillStyle = '#FFD700';
                        this.ctx.textAlign = 'center';
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText(`【盗賊のとくぎ】`, 480, 200); 

                        this.ctx.fillStyle = 'white';
                        this.ctx.textAlign = 'left';
                        this.ctx.font = 'bold 25px sans-serif';
                        this.ctx.fillText(`ランダムの量 GOLD を回収！`, 350, 265);
                        this.ctx.fillText(`大体 500~1500G くらい`, 350, 300);
                    }
    }

    private showObtainGold(): void {

                    // ゴールドの画像を用意
                    const goldImage = this.manager.getImg('goldImg');

                    // 存在チェック
                    if (goldImage) 
                    {
                        this.ctx.textAlign = 'center';
                        this.ctx.font = 'bold 30px sans-serif';
                        this.ctx.fillText("イイものゲット！", 480, 200);

                        // ランダムゴールド生成ロジック
                        // 一桁目は0固定にしたいから一桁目を除外した値を用意
                        const minFactor = 100;
                        const maxFactor = 300;
                        
                        // 範囲内でランダムな整数を生成
                        const randomFactor = Math.floor(Math.random() * (maxFactor - minFactor + 1)) + minFactor;
                        
                        // 10倍して一の位を0にし、最終的なゴールド額を決定
                        const bonusGold = randomFactor * 10;
                        
                        // CoreManagerのゴールドを更新
                        this.manager.GOLD += bonusGold;

                        this.ctx.drawImage(goldImage, 290, 220, 100, 130);
                        this.ctx.font = 'bold 70px sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillStyle = '#FFD700'; // テキストの色を金色に
                        this.ctx.shadowColor = 'black'; // 影の色
                        this.ctx.shadowBlur = 5;        // 影のぼかし具合
                        this.ctx.shadowOffsetX = 2;     // 影のXオフセット
                        this.ctx.shadowOffsetY = 2;     // 影のYオフセット
                        this.ctx.fillText(` +${bonusGold}`, 510, 310); 
                    }
    }

    private showTutorial(): void{
            this.ctx.font = 'bold 50px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700'; // テキストの色を金色に
            this.ctx.shadowColor = 'black'; // 影の色
            this.ctx.shadowBlur = 5;        // 影のぼかし具合
            this.ctx.shadowOffsetX = 2;     // 影のXオフセット
            this.ctx.shadowOffsetY = 2;     // 影のYオフセット
            this.ctx.fillText("旅の心得", 480, 80); 

            this.ctx.font = 'bold 25px sans-serif';
            this.ctx.fillText("GOLDを支払って行動！", 310, 190);
            this.ctx.fillText("今までのEXPがGOLDに！", 650, 190);

            // 説明用の画像
            const warriorImage = this.manager.getImg('warriorImg');
            const cardImage = this.manager.getImg('cardImg');
            if (warriorImage && cardImage) 
            {
                this.ctx.drawImage(cardImage, 200, 220, 220, 120);
                this.ctx.drawImage(warriorImage, 210, 320, 60, 60);
                this.ctx.fillStyle = 'white';
                this.ctx.textAlign = 'left';
                this.ctx.font = 'bold 15px sans-serif';
                this.ctx.fillText("← 勇者たちにカードを", 280, 370);
                this.ctx.fillText("  ドラッグ&ドロップしよう", 280, 390);
            }
            else 
            {
                console.error("タイトル画像が見つかりません: evntImg");
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, 960, 540);
            }

            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 35px sans-serif';
            this.ctx.fillText(`現在の EXP : ${this.manager.EXP}`, 500, 250);
            this.ctx.fillText(`↓`, 535, 300);
            this.ctx.fillText(`今回の GOLD : ${this.manager.GOLD}`, 500, 350);
    }


    // ボタン機能（コールバック）の有効化
    public setupInput(): void {
        const encounterButton = document.getElementById('encounter-button') as HTMLButtonElement;
        if (encounterButton) {
            encounterButton.addEventListener('click', this.encounter);
        }
        encounterButton.classList.remove('hidden');

        // 最初の説明イベントではリザルトボタンを表示しないように
        if (this.manager.roundSceneCount <= 1) return;

        const finishTripButton = document.getElementById('finishTrip-button') as HTMLButtonElement;
        if (finishTripButton) {
            finishTripButton.addEventListener('click', this.finishTrip);
        }
        finishTripButton.classList.remove('hidden');
    }

    // ボタン機能（コールバック）の無効化
    public teardownInput(): void {
        const finishTripButton = document.getElementById('finishTrip-button') as HTMLButtonElement;
        if (finishTripButton) {
            finishTripButton.removeEventListener('click', this.finishTrip);
        }

        const encounterButton = document.getElementById('encounter-button') as HTMLButtonElement;
        if (encounterButton) {
            encounterButton.removeEventListener('click', this.encounter);
        }

        finishTripButton.classList.add('hidden');
        encounterButton.classList.add('hidden');
    }

    // ボタン処理（コールバック）
    private finishTrip = () => {
        this.manager.changeScene('Result');
    };

    private encounter = () => {
        this.manager.changeScene('Battle');
    };





    // カード1枚を描画（※CardRendererにもあるけど、参照経路が複雑なのでもうロジックコピペする）
        private drawSingleCard(card: ICard, x: number, y: number): void {
            
            // 背景
            this.ctx.fillStyle = '#1e3a8a';
            this.ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
            
            // 枠線
            this.ctx.strokeStyle = '#fef3c7';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    
            // アイコン
            const iconImage = this.manager.getImg(card.iconImg);
            if (iconImage) {
                const ICON_SIZE = 40;
                const iconX = x + 20;
                const iconY = y + 20;
                this.ctx.drawImage(iconImage, iconX, iconY, ICON_SIZE, ICON_SIZE);
            } else {
                this.ctx.fillStyle = '#ef4444'; // エラー表示
                this.ctx.fillRect(x + 20, y + 10, 60, 60);
            }
    
            // 名前
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 15px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(card.name, x + CARD_WIDTH / 2, y + 90);
    
            // コスト
            this.ctx.fillStyle = '#fbff7eff';
            this.ctx.font = 'bold 40px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${card.cost}`, x + 120, y + CARD_HEIGHT / 2 + 5);
        }
}