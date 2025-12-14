////// 定数たちがここに集結

// プレイヤーの描画設定
export const PLAYER_STARTPOSITION_X = 160;
export const PLAYER_STARTPOSITION_Y = 320;
export const PLAYER_SIZE_X = 100;
export const PLAYER_SIZE_Y = 100;
export const PLAYER_SPACING = 180; // プレイヤー間の間隔 (i * 200 の部分)

// 敵の描画設定
/*
export const ENEMY_STARTPOSITION_X = 390;
export const ENEMY_STARTPOSITION_Y = 100;
export const ENEMY_SIZE_X = 180;
export const ENEMY_SIZE_Y = 180;
*/

// カードの描画設定
export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 100;
export const CARD_MARGIN = 20;
export const START_X = 160;
export const START_Y = 430;




// ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝没コード＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

// 攻撃時のエフェクト描画
    /*
    public drawAttackEffect(): void {
        
        if (!this.ctx) return;

        const attackImage = this.getImg('attackImg');
        if (attackImage) {

            // ランダムな座標に画像を描画
            const randomX = this.getRandomInt(380, 580);
            const randomY = this.getRandomInt(200, 300);
            this.ctx.drawImage(attackImage, randomX, randomY, 1000, 1000);
            
        } else {
            console.error(`画像が見つかりません: ${attackImage}`);
        }
    }

    // 最大値と最小値を受け取ってその範囲内からランダムで値を返す
    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    */