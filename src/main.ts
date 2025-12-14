
/// 起動時の初期化処理、起動中のロードで行われる処理を担当するクラス

import { CoreManager } from './CoreManager';
import { TitleScene } from './Scene/TitleScene';
import { EventScene } from './Scene/EventScene';
import { BattleScene } from './Scene/BattleScene';
import { ResultScene } from './Scene/ResultScene';

// グローバルな要素を取得
// TypeScriptに対し「これはCanvas要素として扱う」と型を教えています
// ちなみにこれらの機能はアクションリスナー、つまりカーソル機能も含んでいる
const canvas = document.getElementById('canvas') as HTMLCanvasElement; // 真っ白のキャンバスを用意する感じ
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D; // ctxつまり小道具はどうするか？

// リソースロードの実行(実際の画像URLとロード処理が必要)
// 実際はここで全画像のロードを待つ
// 読み込みたい画像の一覧
const ASSET_PATHS = {
    titleImg: '/BackGround/title.png',
    eventImg: '/BackGround/event.png',
    stageImg: '/BackGround/stage.png',
    stageExImg: '/BackGround/stageEx.png',
    stageDxImg: '/BackGround/stageDx.png',
    resultImg: '/BackGround/result.png',
    
    warriorImg: '/Party/warrior.png',
    clericImg: '/Party/cleric.png',
    mageImg: '/Party/mage.png',
    thiefImg: '/Party/thief.png',

    warriorDxImg: '/Enemy/warriorDx.png',
    clericDxImg: '/Enemy/clericDx.png',
    mageDxImg: '/Enemy/mageDx.png',
    thiefDxImg: '/Enemy/thiefDx.png',

    slimeImg: '/Enemy/slime.png',
    slimeExImg: '/Enemy/slimeEx.png',
    
    kinokoImg: '/Enemy/kinoko.png',
    kinokoExImg: '/Enemy/kinokoEx.png',

    goblinImg: '/Enemy/goblin.png',
    goblinExImg: '/Enemy/goblinEx.png',

    zombieImg: '/Enemy/zombie.png',
    zombieExImg: '/Enemy/zombieEx.png',

    treantImg: '/Enemy/treant.png',
    treantExImg: '/Enemy/treantEx.png',
    
    mimicImg: '/Enemy/mimic.png',
    mimicExImg: '/Enemy/mimicEx.png',
    
    hanaImg: '/Enemy/hana.png',
    hanaExImg: '/Enemy/hanaEx.png',

    ghostImg: '/Enemy/ghost.png',
    ghostExImg: '/Enemy/ghostEx.png',

    frankensteinImg: '/Enemy/frankenstein.png',
    frankensteinExImg: '/Enemy/frankensteinEx.png',

    goyaImg: '/Enemy/goya.png',
    goyaExImg: '/Enemy/goyaEx.png',
    
    goldImg: '/Enemy/gold.png',
    goldExImg: '/Enemy/goldEx.png',
    
    expImg: '/Enemy/exp.png',
    expExImg: '/Enemy/expEx.png',
    
    dragonImg: '/Enemy/dragon.png',
    dragonExImg: '/Enemy/dragonEx.png',

    angelImg: '/Enemy/angel.png',
    angelExImg: '/Enemy/angelEx.png',
    
    kaifukuImg: '/Effect/kaifuku.png',
    attackImg: '/Effect/attack.png',
    specialImg: '/Effect/special.png',
    fukkatuImg: '/Effect/fukkatu.png',
    jyoutaiImg: '/Effect/jyoutai.png',
    mukimukiImg: '/Effect/mukimuki.png',
    mutekiImg: '/Effect/muteki.png',
    nowmutekiImg: '/Effect/nowmuteki.png',
    tairyokuImg: '/Effect/tairyoku.png',
    
    bikkuriImg: '/Effect/bikkuri.png',
    hatenaImg: '/Effect/hatena.png',

    tokugi_clericImg: '/Effect/tokugi_cleric.png',
    tokugi_mageImg: '/Effect/tokugi_mage.png',
    tokugi_thief: '/Effect/tokugi_thief.png',
    tokugi_warrior: '/Effect/tokugi_warrior.png',
    tokugi_warrior2: '/Effect/tokugi_warrior2.png',

    hakaImg: '/Effect/haka.png',
    cardImg: '/Effect/card.png',
    hanabiImg: '/Effect/hanabi.png',
    hanabi2Img: '/Effect/hanabi2.png',
};

// 非同期処理の仕組みであるPromiseを活用
function loadImages(): Promise<Record<string, HTMLImageElement>> {

    // ASSET_PATHSで定めたkey一覧
    const promises: Promise<{ key: string, image: HTMLImageElement }>[] = [];

    // ASSET_PATHSの各エントリについてループ
    for (const [key, path] of Object.entries(ASSET_PATHS)) {
        
        // Imageオブジェクトを生成(プログラム上で扱うため画像もインスタンス化しないといけないのか…）
        const image = new Image();
        
        // 画像ロードのPromiseを作成
        const imageLoadPromise = new Promise<{ key: string, image: HTMLImageElement }>((resolve, reject) => {
            image.onload = () => resolve({ key, image }); // resolveだから解決！ということ。then-catchのthenの方を処理させる
            image.onerror = () => reject(new Error(`画像のロードに失敗しました: ${path}`)); // こっちは失敗した時
        });
        
        // 画像の読み込みを開始
        image.src = path;
        promises.push(imageLoadPromise);
    }

    // すべてのPromiseが完了するのを待つ
    return Promise.all(promises).then(results => {

        // 結果を {Img: ImageElement, event: ImageElement} の形にして返す
        const images: Record<string, HTMLImageElement> = {};

        for (const result of results) {
            images[result.key] = result.image;
        }
        return images;
    });
}


// 画像ロードが完了したら呼ばれる関数
function onAllResourcesLoaded(images: any) {

    // CoreManagerの起動
    const manager = CoreManager.getInstance();

    // グローバルで定義したCanvas要素とContextを登録
    manager.registerCanvasElement(canvas);
    manager.registerContext(ctx);

    // 全画像をCoreManagerに登録する
    manager.registerAssets(images);

    // すべてのシーンのインスタンスを作成し、接続
    const titleScene = new TitleScene(ctx, manager);
    const eventScene = new EventScene(ctx, manager);
    const battleScene = new BattleScene(ctx, manager);
    const resultScene = new ResultScene(ctx, manager);

    // CoreManagerにシーンを登録(これでシーン遷移を可能にする)(Map付け)
    manager.registerScene('Title', titleScene);
    manager.registerScene('Event', eventScene);
    manager.registerScene('Battle', battleScene);
    manager.registerScene('Result', resultScene);

    // ゲームの開始（CoreManagerにゲームを実行させる）
    manager.Initialize();
}


// <script type="module" src="/src/　　main.ts　　"></script>で呼ばれたとき、全てはここから始まる

// 素材をロードし、無事完了したら onAllResourcesLoaded を呼び出す
// try-catchでもいけるみたい、それにしてもいい
loadImages()
    .then(onAllResourcesLoaded)
    .catch(error => console.error("ゲームの初期化中にエラーが発生しました:", error));