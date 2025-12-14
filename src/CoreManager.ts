
import type { IScene } from './interface/IScene'; // 実体を持たないクラスはtypeいるらしい（インスタンス化してないinteraceはtype必須）
import type { ICard } from './interface/ICard'; 
import { StatusData } from './StatusData';
import { CardsData } from './CardsData';
import type { EnemyDefinition } from './StatusData';
import type { PlayerDefinition } from './StatusData';
import { BattleScene } from './Scene/BattleScene';

export type GameScene = 'Title' | 'Event' | 'Battle' | 'Result';

export class CoreManager {

    // 今のシーン（最初はTitle）（今のところ活躍無し）
    public currentScene: GameScene = 'Title';

    // 所持金
    public GOLD: number = 0;
    
    // シャッフルコストと増加量
    public shuffleCost: number = 0;
    public shuffleCostBoost: number = 100;
    public shuffleCostBase: number = 100;

    // 経験値
    public EXP: number = 0;
    public secretButtonPushNum: number = 0;

    // 敵とのエンカウント数（戦闘に入る前のEventSceneで1増える）
    public roundSceneCount: number = 0;

    // ○○○○SceneクラスとGameSceneの型を結びつける（Map/Dictionary）
    private sceneInstances: { [key in GameScene]?: IScene } = {};

    // 現在アクティブなシーンのインスタンスを参照（そのクラスのメソッドを呼べるように）
    public activeScene: IScene | null = null; // nullを許容し、初期値として設定しないとエラーなる

    // Canvas要素への参照を追加
    private canvasElement: HTMLCanvasElement | null = null; // 最初はnull
    public ctx: CanvasRenderingContext2D | null = null;

    // 画像を格納するコンテナ
    private imgAssets: Record<string, HTMLImageElement> = {};

    // プレイヤーと敵のデータレジストリ
    private statusData: StatusData;
    
    // 全カードのデータレジストリ
    private cardsData: CardsData;

    // 所持中のカードレジストリ
    private inventoryCards: ICard[] = [];

    // 選べるカードの枚数
    public handSize: number = 4;

    // 表示するメッセージを保持、ここにあるテキストが表示される
    private currentDisplayMessage: string = "";

    
    // ------------------ 初期化処理(一度だけ呼ばれる) ------------------
    
    // シングルトンを作る(どこからでも参照可能に)
    // 一つだけインスタンス化するためにprivate
    private static instance: CoreManager;
    private constructor() 
    {
        // CoreManagerのインスタンス生成時にデータレジストリを初期化
        this.statusData = new StatusData();
        this.cardsData = new CardsData();

        // 初期手札を獲得する
        this.initializeInventory();
    }
    public static getInstance(): CoreManager 
    {
        if (!CoreManager.instance) 
        {
            CoreManager.instance = new CoreManager();
        }
        return CoreManager.instance;
    }

    // 起動時の初期化と最初のシーン呼び出し
    public Initialize(): void 
    {
        this.changeScene('Title'); // 起動時は最初titleシーンを呼び出す
    }

    // シーンインスタンスを登録するメソッド
    public registerScene(name: GameScene, sceneInstance: IScene): void {
        this.sceneInstances[name] = sceneInstance;
    }

    // main.ts から全ロード済みの画像を受け取り格納する
    public registerAssets(loadedAssets: Record<string, HTMLImageElement>): void {
        this.imgAssets = loadedAssets;
    }

    // Canvas要素を登録するメソッド（mainから登録される）
    public registerCanvasElement(canvas: HTMLCanvasElement): void {
        this.canvasElement = canvas;
    }

    // CanvasのContext（描画オブジェクト）を登録するメソッド（mainから登録される）
    public registerContext(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }
    
    




    // ------------------ 各クラスから呼ばれるミニ機能 ------------------
    

    // Unityの SceneManager.LoadScene() に相当するシーンの切り替え処理
    // interfaceのおかげでメソッド名が同じでも、中身が異なるシーン処理が実行されていく～ん
    public changeScene(newScene: GameScene): void {

        if (this.activeScene) 
        {
            this.activeScene.teardownInput(); // 古いシーンの終了処理
        }

        // Map付けした配列から今回のシーンを選び抜く
        const nextScene = this.sceneInstances[newScene];
        
        if (nextScene) 
        {
            // 新たなシーンとして更新
            this.currentScene = newScene;
            this.activeScene = nextScene;
            
            // interfaceで定めたメソッドを呼ぶ
            this.activeScene.start();
            this.activeScene.draw();
            this.activeScene.setupInput();
        } 
        else 
        {
            console.error(`シーン ${newScene} が登録されていません。`);
        }
    }

    // 経過時間を挟む非同期処理
    public async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Canvas要素を取得するメソッド
    public getCanvasElement(): HTMLCanvasElement | null {
        return this.canvasElement;
    }

    // 現在アクティブなシーンにdrawを呼び出す（interfaceのおかげで指定しなくて済むね）
    public redrawActiveScene(): void {
        this.activeScene?.draw();
    }

    // 使用したい画像を取得させる
    public getImg(key: string): HTMLImageElement | undefined {
        return this.imgAssets[key];
    }

    // プレイヤーのデータを全て返す
    public getAllPlayerDefinitions(): PlayerDefinition[] {
        return this.statusData.getAllPlayerDefinitions();
    }

    // 存在するカードデータを全て返す
    public getAllCardDefinitions(): ICard[] {
        return this.cardsData.getAllCardDefinitions();
    }

    // パーティのステータスを初期状態にするメソッド
    public resetPlayerStatus(): void {
        const players = this.getAllPlayerDefinitions();
        players.forEach(player => {
            player.hp = player.basehp; 
            player.maxhp = player.basehp;
            player.atk = player.baseatk; 
            player.invincible = 0;
            player.target = 0;
            this.handSize = 4;
            this.shuffleCost = this.shuffleCostBase;
        });
    }

    // 敵エンカウントのロジックと抽選結果
    public getRandomEnemyDefinition(): EnemyDefinition | undefined {

        // 配列の中に取り寄せたい敵のIDを用意する
        let enemyPoolIds: number[];
        if (this.roundSceneCount <= 2) 
        {
            // 1~10のIDが対象：2ラウンド以内（初期状態でドラゴンと天使は流石にやばいかと）
            enemyPoolIds = [1, 2, 3];
            // enemyPoolIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
        } 
        else if (this.roundSceneCount <= 7){
            // 3~12のIDが対象：7ラウンド以内
            enemyPoolIds = [4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        else if (this.roundSceneCount <= 15) 
        {
            // 13~24のIDが対象：15ラウンド以内
            enemyPoolIds = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
        } 
        else 
        { 
            // 13~28のIDが対象：16ラウンド以降
            enemyPoolIds = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
        }

        // 敵の定義リスト全体
        const allEnemies = this.statusData.getAllEnemyDefinitions();

        // enemyPoolIds.length を利用してランダムなインデックスを取得(0から始まる)
        const randomIndex = Math.floor(Math.random() * enemyPoolIds.length);

        // ランダムに選ばれたID（[0]これがidの1を参照するからこれで大丈夫）
        const selectedEnemyId = enemyPoolIds[randomIndex];

        // const selectedEnemyId = enemyPoolIds[27]; // テスト用

        // IDに基づいて敵を確定（オリジナルのデータ）
        const originalEnemy = allEnemies.find(enemy => enemy.id === selectedEnemyId);
        
        if (originalEnemy) {
            
            // オリジナルから全プロパティをコピー。これで毎回初期値を持つモンスターを作れる
            const freshEnemy: EnemyDefinition = { ...originalEnemy, };

            // ラウンド数に応じてステータスを調整
            if (this.roundSceneCount < 20) {
                freshEnemy.hp *= 1.0;
                freshEnemy.maxhp *= 1.0;
                freshEnemy.atk *= 1.0; 
            } else if (this.roundSceneCount < 30) {
                freshEnemy.hp *= 2.0;
                freshEnemy.maxhp *= 2.0;
                freshEnemy.atk *= 2.0; 
            } else if (this.roundSceneCount < 40) {
                freshEnemy.hp *= 3.0;
                freshEnemy.maxhp *= 3.0;
                freshEnemy.atk *= 3.0;
            } else if (this.roundSceneCount < 50) {
                freshEnemy.hp *= 4.0;
                freshEnemy.maxhp *= 4.0;
                freshEnemy.atk *= 4.0;
            } else if (this.roundSceneCount < 60) {
                freshEnemy.hp *= 5.0;
                freshEnemy.maxhp *= 5.0;
                freshEnemy.atk *= 5.0;
            } else if (this.roundSceneCount < 70) {
                freshEnemy.hp *= 6.0;
                freshEnemy.maxhp *= 6.0;
                freshEnemy.atk *= 6.0;
            } else if (this.roundSceneCount < 80) {
                freshEnemy.hp *= 7.0;
                freshEnemy.maxhp *= 7.0;
                freshEnemy.atk *= 7.0;
            } else if (this.roundSceneCount < 90) {
                freshEnemy.hp *= 8.0;
                freshEnemy.maxhp *= 8.0;
                freshEnemy.atk *= 8.0;
            } else if (this.roundSceneCount < 100) {
                freshEnemy.hp *= 9.0;
                freshEnemy.maxhp *= 9.0;
                freshEnemy.atk *= 9.0;
            } else {
                freshEnemy.hp *= 10.0;
                freshEnemy.maxhp *= 10.0;
                freshEnemy.atk *= 10.0;
            }

            // HPは整数である場合が多いので、Math.floorなどで切り捨てることを検討してください
            freshEnemy.hp = Math.floor(freshEnemy.hp);
            
            // コピーした新しい敵オブジェクトを返す
            return freshEnemy;
        }
        
        return undefined;
    }

    // 初期デッキの構築(再プレイ時の初期化時にも)
    public initializeInventory(): void {

        // 一旦、存在する全てのカードを初期デッキに追加
        const allCards = this.cardsData.getAllCardDefinitions();

        // 最初にインベントリに入れたいカードのIDを定義（一応重複可）
        const initialCardIds: number[] = [1, 3, 5, 7, 9, 11, 13, 15];
        // const initialCardIds: number[] = [16];

        // まずインベントリを空にする
        this.inventoryCards = [];

        for (const cardId of initialCardIds) {

            // allCards配列全体からIDが一致する要素を検索する
            const cardDefinition = allCards.find(card => card.id === cardId);

            // カードが見つかったらインベントリに追加
            if (cardDefinition) {
                this.inventoryCards.push(cardDefinition);
            } else {
                console.warn(`警告: カードID ${cardId} がCardsDataに見つかりませんでした。`);
            }
        }
    }

    // CardRendererから呼ばれるカード実行フローの開始メソッド
    // インスタンスまで参照しないといけないからかわりにCoreが命令で委譲
    public executeCardFlow(card: ICard, targetIndex: number): void {

        // 現在のシーンが BattleScene であり、かつメソッドが存在することを確認
        if (this.activeScene instanceof BattleScene) {
            this.activeScene.ExecuteCardFlow(card, targetIndex);
        } else {
            console.error("現在、BattleSceneではありません。カード処理をスキップします。");
        }
    }

    // 所持中のカードを返す
    public getInventoryCards(): ICard[] {
        return this.inventoryCards;
    }

    // まだインベントリにないカードIDをランダムで1枚選び、追加しつつそのカードを返す
    // 全ての種類のカードを所持している場合は、nullを返して分岐につなげる
    public acquireRandomNewCard(): ICard | null {
        
        // 全てのカード定義を取得
        const allCards = this.cardsData.getAllCardDefinitions();
        
        // 全カード定義のIDをチェックし、所持していないものだけをリストアップ
        const allUniqueCardIds = new Set(allCards.map(card => card.id));

        // 現在インベントリに存在するカードのIDだけを用意
        const PossessedCardIds = new Set(this.inventoryCards.map(card => card.id));

        // まだ所持していないカードのIDリストを用意
        const unpossessedCardIds: number[] = [];

        // 全カードIDと所持カードIDを比較して持ってないカードIDを抽出
        allUniqueCardIds.forEach(id => {
            if (!PossessedCardIds.has(id)) {
                unpossessedCardIds.push(id);
            }
        });
        
        // その結果配列0、つまり全部持ってた場合nullを返して追加せず終了
        if (unpossessedCardIds.length === 0) {
            console.log("全ての種類のカードを所持しています。");
            return null;
        }

        // まだ所持していないカードIDからランダムで1つ選択
        const randomIndex = Math.floor(Math.random() * unpossessedCardIds.length);
        const selectedCardId = unpossessedCardIds[randomIndex];
        
        // 選択されたIDのカード定義を取得して
        const newCardDefinition = allCards.find(card => card.id === selectedCardId);

        // 今のインベントリにようやく追加！
        if (newCardDefinition) {
            this.inventoryCards.push(newCardDefinition);
            return newCardDefinition;
        }

        return null; 
    }


    // 今のメッセージを更新
    public setMessage(message: string): void {
        this.currentDisplayMessage = message;
        this.redrawActiveScene(); // 再描画を要求その時にdrawMessageも呼ばれるから
    }

     // 今のメッセージを描画（連続処理に対応できるよう描画だけ）
    public drawMessage(): void {

        // nullチェック
        if (!this.ctx) return;

        // UI描画と競合しないよう、描画スタイルを設定
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 25px sans-serif';
        this.ctx.fillStyle = 'white'; // テキストの色
        
        // メッセージをテキストウィンドウ内に描画
        this.ctx.fillText(this.currentDisplayMessage, 25, 45);
    }
}