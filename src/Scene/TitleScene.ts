
import type { IScene } from '../interface/IScene'; 
import type { PlayerDefinition } from '../StatusData';
import { CoreManager } from '../CoreManager'; // 実体を持つクラスはtypeいらないみたい

export class TitleScene implements IScene {

    public ctx: CanvasRenderingContext2D;
    public manager: CoreManager;

    constructor(ctx: CanvasRenderingContext2D, manager: CoreManager) {
        this.ctx = ctx;
        this.manager = manager;
    }

    // Unityの Start() に相当
    public start(): void {
        this.manager.secretButtonPushNum = 0;
        this.manager.roundSceneCount = 0;
    }

    // 描画処理
    public draw(): void {

        // 前のシーンにあった描画を全て消す
        this.ctx.clearRect(0, 0, 960, 540);
        
        // CoreManagerから画像を取得する
        const stageImage = this.manager.getImg('titleImg');

        // 存在チェック
        if (stageImage) 
        {
            // タイトルの背景を描画
            this.ctx.drawImage(stageImage, 0, 0, 960, 540);
        }
        else 
        {
            // 無い場合のデバッグ表示や代替処理
            console.error("タイトル画像が見つかりません: titleImg");
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, 960, 540);
        }
        
        // タイトルで用いるテキストを描画
        this.ctx.font = 'bold 90px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700'; // テキストの色を金色に
        this.ctx.shadowColor = 'black'; // 影の色
        this.ctx.shadowBlur = 5;        // 影のぼかし具合
        this.ctx.shadowOffsetX = 3;     // 影のXオフセット
        this.ctx.shadowOffsetY = 3;     // 影のYオフセット
        this.ctx.fillText("戦え勇者たち", 480, 150); 

        // 次のテキストの設定
        this.ctx.font = '30px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white'; // こちらのテキストは白に
        this.ctx.fillText("EXP " + this.manager.EXP, 15, 40);

        // プレイヤーの描画(お飾り)
        const players: PlayerDefinition[] = this.manager.getAllPlayerDefinitions();
        
                for (let i = 0; i < players.length; i++) {
                    
                    // プレイヤーの情報
                    const player = players[i];
                    const playerImage = this.manager.getImg(player.image);
                    
                    if (playerImage) {
        
                        // 描画位置を調整: 最初のプレイヤーのX位置からずらして横に並べる
                        const positionX = 365 + i * 60; 
                        const positionY = 470;
                        const sizeX = 50;
                        const sizeY = 50;
        
                        // プレイヤー画像を描画
                        this.ctx.shadowColor = 'black'; // 影の色
                        this.ctx.shadowBlur = 5;        // 影のぼかし具合
                        this.ctx.shadowOffsetX = 3;     // 影のXオフセット
                        this.ctx.shadowOffsetY = 3;     // 影のYオフセット
                        this.ctx.drawImage(playerImage, positionX, positionY, sizeX, sizeY);
        
                    } else {
                        console.error(`プレイヤー画像が見つかりません: ${player.image}`);
                    }
                }
    }

    // ボタン機能（コールバック）の有効化
    public setupInput(): void {
        // GameObject.Find("next-button")みたいな機能。HTML文から探す
        // nextButton.onClick.AddListener(handleNext);みたいな機能
        const startTripButton = document.getElementById('startTrip-button') as HTMLButtonElement;
        if (startTripButton) {
            startTripButton.addEventListener('click', this.startTrip);
        }

        const secretButton = document.getElementById('secret-button') as HTMLButtonElement;
        if (secretButton) {
            secretButton.addEventListener('click', this.secret);
        }
        
        // 現在表示中のボタン（addされてる）は消しておく
        startTripButton.classList.remove('hidden'); 
        secretButton.classList.remove('hidden'); 
    }

    // ボタン機能（コールバック）の無効化
    public teardownInput(): void {
        const startTripButton = document.getElementById('startTrip-button') as HTMLButtonElement;
        if (startTripButton) {
            startTripButton.removeEventListener('click', this.startTrip);
        }

        const secretButton = document.getElementById('secret-button') as HTMLButtonElement;
        if (secretButton) {
            secretButton.removeEventListener('click', this.secret);
        }

        // 表示されたので、非表示の対象者としてaddされる
        startTripButton.classList.add('hidden');
        secretButton.classList.add('hidden');
    }

    // ボタン処理（コールバック）
    private startTrip = () => {
        this.manager.changeScene('Event');
    };

    private secret = () => {
        console.log("シークレットボタン" + this.manager.secretButtonPushNum)
        this.manager.secretButtonPushNum++;

        // 10回押されたらEXP増やしちゃう
        if(this.manager.secretButtonPushNum > 4)
        {
            this.manager.EXP += 100;
            this.manager.secretButtonPushNum = 0;
            this.draw(); // 再描画
        }
    };
}