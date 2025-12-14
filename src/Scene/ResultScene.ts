
import type { IScene } from '../interface/IScene'; 
import { CoreManager } from '../CoreManager';

export class ResultScene implements IScene {

    public ctx: CanvasRenderingContext2D;
    public manager: CoreManager;

    constructor(ctx: CanvasRenderingContext2D, manager: CoreManager) {
        this.ctx = ctx;
        this.manager = manager;
    }

    public start(): void {

    }

    public draw(): void {

        // 前のシーンにあった描画を全て消す
        this.ctx.clearRect(0, 0, 960, 540);
        
        // イベント用の背景画像
        const resultImage = this.manager.getImg('resultImg');
        const hanabiImage = this.manager.getImg('hanabiImg');
        const hanabi2Image = this.manager.getImg('hanabi2Img');

        // 存在チェック
        if (resultImage && hanabiImage && hanabi2Image) 
        {
            // リザルトの背景を描画
            this.ctx.drawImage(resultImage, 0, 0, 960, 540);

            // 特定の討伐数で花火の演出で褒めますよ！！
            if (this.manager.roundSceneCount > 15) {

                // 影の描画
                this.ctx.shadowColor = 'black';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;

                // 花火たち
                this.ctx.drawImage(hanabiImage, 210, 80, 100, 100);
                this.ctx.drawImage(hanabi2Image, 70, 190, 100, 100);
                this.ctx.drawImage(hanabi2Image, 640, 130, 100, 100);
                this.ctx.drawImage(hanabiImage, 800, 250, 100, 100);
            }
        }
        else 
        {
            // 無い場合のデバッグ表示や代替処理
            console.error("タイトル画像が見つかりません: resultImg");
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, 960, 540);
        }
        
        // 秘密のボタンを示唆するヒント文
        this.ctx.font = 'bold 20px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#1c005cff';
        this.ctx.fillText(`Click here in the title`, 10, 25); 

        // 影の描画
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.font = 'bold 40px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(`今日の討伐数`, 480, 150); 
        
        this.ctx.font = 'bold 100px sans-serif';
        this.ctx.fillText(`${this.manager.roundSceneCount - 1}`, 480,290); 
    }

    // ボタン処理
    public setupInput(): void {
        const titleButton = document.getElementById('title-button') as HTMLButtonElement;
        if (titleButton) {
            titleButton.addEventListener('click', this.title);
        }

        titleButton.classList.remove('hidden'); 
    }

    // ボタン処理
    public teardownInput(): void {
        const titleButton = document.getElementById('title-button') as HTMLButtonElement;
        if (titleButton) {
            titleButton.removeEventListener('click', this.title);
        }

        titleButton.classList.add('hidden'); 
    }

    // ボタン処理（コールバック）
    private title = () => {
        this.manager.changeScene('Title');
    };
}