
import { CoreManager } from './CoreManager';
import type { ICard } from './interface/ICard';

import { 
    PLAYER_STARTPOSITION_X, 
    PLAYER_STARTPOSITION_Y, 
    PLAYER_SIZE_X, 
    PLAYER_SIZE_Y, 
    PLAYER_SPACING,
    CARD_WIDTH,
    CARD_HEIGHT,
    CARD_MARGIN,
    START_X,
    START_Y
} from './BattleConstant';


export class CardRenderer {

    // ドラッグ時の各プレイヤーのターゲット領域を管理する
    private playerTargetAreas: { 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        isHovered: boolean 
    }[] = [];

    // 描画されているカードとその位置を管理するリスト
    private activeCards: {  card: ICard, 
                            x: number, 
                            y: number, 
                            index: number } [] = [];

    // ドラッグ中のカード情報
    private draggingCard: { card: ICard, 
                            offsetX: number, 
                            offsetY: number, 
                            originalIndex: number,
                            originalX: number, 
                            originalY: number } | null = null; // 最初はnull

    // ドロップの成功状態を保持する
    private isDropSucceeded: boolean = false;

    private ctx: CanvasRenderingContext2D;
    private manager: CoreManager;
    private canvas: HTMLCanvasElement | null = null;

    constructor(ctx: CanvasRenderingContext2D, manager: CoreManager) {
        this.ctx = ctx;
        this.manager = manager;
        this.canvas = manager.getCanvasElement();

        // ドラッグ時に反応する各プレイヤーの領域を初期化
        const playersCount = this.manager.getAllPlayerDefinitions().length; 
        for (let i = 0; i < playersCount; i++) {
                this.playerTargetAreas.push({
                x: PLAYER_STARTPOSITION_X + i * PLAYER_SPACING, 
                y: PLAYER_STARTPOSITION_Y,
                width: PLAYER_SIZE_X,
                height: PLAYER_SIZE_Y,
                isHovered: false
            });
        }
    }

    public resetActiveCards(): void {
        // ゲーム終了時など。
        // 所持カードをリセット、デフォルトに戻す
    }

    // カードの初期化処理（データだけあったカード情報をようやく実体化させる感じ）
    public initializeCards(handCards: ICard[]): void {

        // 受け取った手札で更新させるため所持カードをリセット
        this.activeCards = [];

        for (let i = 0; i < handCards.length; i++) {

            const card = handCards[i];
            const x = START_X + i * (CARD_WIDTH + CARD_MARGIN);
            const y = START_Y;

            this.activeCards.push({
                card: card,
                x: x,
                y: y,
                index: i
            });
        }
    }

    // 所持カードの一括描画処理
    public draw(): void {
        
        // ドラッグ中に特定の領域に触れたら強調表示させるやつ
        this.drawTargetHighlights();

        // 既存のカード描画
        for (const cardData of this.activeCards) {
            this.drawSingleCard(cardData.card, cardData.x, cardData.y);
        }
    }


    // ターゲットを強調表示する描画
    private drawTargetHighlights(): void {
        
        // 各プレイヤーたちのドラッグドロップ許可の可視化処理
        for (let i = 0; i < this.playerTargetAreas.length; i++) {
            const area = this.playerTargetAreas[i];
            
            // isHoveredがtrueの場合、領域をオーバーレイ
            if (area.isHovered) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                this.ctx.fillRect(area.x, area.y, area.width, area.height);
            }
        }
    }
    

    // 入力イベントの有効化
    public setupInput(): void {

        // Canvasへのイベントリスナーを追加
        this.canvas?.addEventListener('mousedown', this.handleMouseDown);
        this.canvas?.addEventListener('mousemove', this.handleMouseMove);
        
        // canvas外も検知できるようにして
        window.addEventListener('mouseup', this.handleMouseUp);

        // Canvas外に出たときの処理もできるように
        this.canvas?.addEventListener('mouseleave', this.handleMouseLeave);
    }

    // 入力イベントの無効化
    public teardownInput(): void {
        this.canvas?.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas?.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas?.removeEventListener('mouseleave', this.handleMouseLeave);
        
        // ドラッグ状態をリセット
        this.draggingCard = null;
    }


    // マウスを押し下げた時に実行
    private handleMouseDown = (e: MouseEvent) => {

        // nullチェック
        if(!this.canvas) return;

        // ブラウザ上のクリック位置をCanvas内の座標に落とし込む
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // その座標にカードがあるかを確認
        const targetCardData = this.getCardAtPoint(x, y);

        // ドラッグできたデータをさっそくドラッグ枠に記録
        if (targetCardData) {
            this.draggingCard = {
                card: targetCardData.card,
                originalIndex: targetCardData.index,
                offsetX: x - targetCardData.x,
                offsetY: y - targetCardData.y,
                originalX: targetCardData.x, 
                originalY: targetCardData.y
            };
            
            // ドラッグ中のカードを配列移動（配列末尾が最後に処理、つまり最も手前に描画されるようにするため）
            // targetCardData と一致するオブジェクトが何番目にあるかを探している
            const indexInArray = this.activeCards.indexOf(targetCardData);
            if (indexInArray > -1) {
                this.activeCards.splice(indexInArray, 1); // そのインデックスから取り除く(2だと次の箇所も取っちゃうので1)
                this.activeCards.push(targetCardData); // そしたらまた入れて配列末尾に
            }
        }
    }

    // マウス座標のヒットテスト
    private getCardAtPoint(x: number, y: number) {

        // 手前（表にみえる順）に判定
        for (let i = this.activeCards.length - 1; i >= 0; i--) {

            // カードのデータを取り出して領域を確認
            const cardData = this.activeCards[i];
            if (x >= cardData.x && x <= cardData.x + CARD_WIDTH &&
                y >= cardData.y && y <= cardData.y + CARD_HEIGHT) {
                return cardData;
            }
        }
        return null;
    }

    // カードのドラッグ操作処理(Update()方式)
    private handleMouseMove = (e: MouseEvent) => {
        
        // nullチェック
        if (!this.draggingCard) return;
        if(!this.canvas) return;

        // handleMouseDownと同様、現在のマウス位置をCanvas用の座標に変換
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 最前面になるカードを取得
        const currentCardData = this.activeCards[this.activeCards.length - 1];
        
        // 現在のマウス位置、現在のカード位置、調合
        if (currentCardData) {
            currentCardData.x = x - this.draggingCard.offsetX;
            currentCardData.y = y - this.draggingCard.offsetY;
        }

        // ★★★ ターゲット領域との衝突判定と強調表示の更新 ★★★
    
        // 全ターゲットの強調フラグをリセットしている間…
        this.playerTargetAreas.forEach(area => area.isHovered = false);

        // ドラッグ中のカードの中心座標を計算（ドロップ位置として使用）
        const cardCenterX = currentCardData.x + CARD_WIDTH / 2;
        const cardCenterY = currentCardData.y + CARD_HEIGHT / 2;
        
        // 各ターゲット領域とカードの中心が衝突しているかチェック
        for (let i = 0; i < this.playerTargetAreas.length; i++) {

            // まず、プレイヤーの情報を取得して…
            const player = this.manager.getAllPlayerDefinitions()[i]; 
            
            // 体力が0以下なら強調を無効化、でも復活系だったら通す
            if (player.hp <= 0 
                && this.draggingCard.card.name != 'ふっかつ'
                && this.draggingCard.card.name != 'みんなふっかつ'){
                continue;
            } 

            // 逆に体力あるのに復活系だったら通さない
            if (player.hp > 0 
                && (this.draggingCard.card.name == 'ふっかつ'
                || this.draggingCard.card.name == 'みんなふっかつ')){
                continue;
            } 

            // そしたら、座標情報を把握して…
            const area = this.playerTargetAreas[i];
            
            if (cardCenterX >= area.x && cardCenterX <= area.x + area.width &&
                cardCenterY >= area.y && cardCenterY <= area.y + area.height) {
                
                // 衝突成功！
                area.isHovered = true;
                
                // 全体効果カードであれば、他のプレイヤーも強調する
                if (this.draggingCard.card.isTargetAll) {
                    this.playerTargetAreas.forEach((a, idx) => {
                        
                        // 他のメンバーも体力あってかつ、復活系じゃないならtrueに
                        if (this.manager.getAllPlayerDefinitions()[idx].hp > 0
                            && this.draggingCard?.card.name != 'ふっかつ'
                            && this.draggingCard?.card.name != 'みんなふっかつ') 
                        {
                            a.isHovered = true;
                        }
                        // 他のメンバーも体力無くてかつ、復活系ならtrueに
                        else if (this.manager.getAllPlayerDefinitions()[idx].hp <= 0 && 
                                    (this.draggingCard?.card.name == 'ふっかつ'
                                    || this.draggingCard?.card.name == 'みんなふっかつ')
                                )
                        {
                            a.isHovered = true;
                        }
                    });
                }
                break;
            }
        }

        // シーンの再描画を連続要求(これないとお絵かきツールの連続描画になる)
        this.manager.redrawActiveScene();
    }

    // クリック終了のドロップ処理
    public handleMouseUp = () => {
        
        // 含んでいない、つまりドラッグ中じゃないなら返す
        if (!this.draggingCard || !this.canvas) return;

        // 使用するカード
        const cardToPlay = this.draggingCard.card;

        // 現在ドラッグ中のカードのデータを取得（最前面にある）
        const currentCardData = this.activeCards[this.activeCards.length - 1];

        // ドロップ位置判定ロジックを初期化！（前回成功した時含めて対処）
        this.isDropSucceeded = false;
        
        // 現在のカードの中心座標を取得
        const dropX = currentCardData.x + CARD_WIDTH / 2;
        const dropY = currentCardData.y + CARD_HEIGHT / 2;
        
        // ターゲット領域にドロップされたかチェック
        for (let i = 0; i < this.playerTargetAreas.length; i++) {

            // まず、プレイヤーの情報を取得して…
            const player = this.manager.getAllPlayerDefinitions()[i]; 
            
            // 体力が0以下なら強調を無効化、でも復活系だったら通す
            if (player.hp <= 0 
                && this.draggingCard.card.name != 'ふっかつ'
                && this.draggingCard.card.name != 'みんなふっかつ'){
                continue;
            } 

            // 逆に体力あるのに復活系だったら通さない
            if (player.hp > 0 
                && (this.draggingCard.card.name == 'ふっかつ'
                || this.draggingCard.card.name == 'みんなふっかつ')){
                continue;
            } 

            // そしたら、座標情報を取得して…
            const area = this.playerTargetAreas[i];
            
            if (dropX >= area.x && dropX <= area.x + area.width &&
                dropY >= area.y && dropY <= area.y + area.height) {

                // お金の清算
                if (cardToPlay.cost <= this.manager.GOLD) {
                    this.manager.GOLD -= cardToPlay.cost;
                }
                else {
                    // 足りなかったらその場で終わり
                    this.manager.setMessage(`残念ですが、お金が足りません`);
                    break;
                }
                
                // ドロップ成功！
                this.isDropSucceeded = true;
                console.log(`カード ${cardToPlay.name} をプレイヤーID ${i + 1} に使用しました!`);
                
                // BattleSceneに処理を依頼
                this.manager.executeCardFlow(cardToPlay, i+1);

                break; 
            }
        }


        // データがあるかつ、カードドロップに成功してなければ
        // （再挿入するので分岐しないと再ドローする時に配列おかしくなる）
        if (currentCardData && !this.isDropSucceeded) {
            
            // 座標を元の位置に戻す
            currentCardData.x = this.draggingCard.originalX; 
            currentCardData.y = this.draggingCard.originalY;

            // 配列の順番を元に戻す
            const originalIndex = this.draggingCard.originalIndex;
            
            // 最前面から削除(スタックみたいな挙動で配列末尾のデータ)
            this.activeCards.pop(); 
            
            // 元の位置に挿入
            this.activeCards.splice(originalIndex, 0, currentCardData); 
        }

        // これにてドラッグは終了、ドラッグ枠をリセット
        this.draggingCard = null;
        
        // 全ターゲットの強調フラグもリセット
        this.playerTargetAreas.forEach(area => area.isHovered = false);

        // 元の位置に戻した座標で画面を再描画
        this.manager.redrawActiveScene();
    }


    // canvasから外れた時の処理。handleMouseUpを呼んで同様に、ドラッグのキャンセルをする
    private handleMouseLeave = () => {
        this.handleMouseUp();
    }

    
    // カード1枚を描画
    private drawSingleCard(card: ICard, x: number, y: number): void {

        // 影の描画
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
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