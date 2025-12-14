

import type { IEnemyStatus } from './interface/IEnemyStatus';
import type { IPlayerStatus } from './interface/IPlayerStatus';

export type EnemyDefinition = IEnemyStatus; // 外部からデータに参照したい時、この型を必要とする
export type PlayerDefinition = IPlayerStatus; // playerとenemyで分けるためそれぞれの型が必要

export class StatusData {

    // CoreManagerで用いるデータ送信の窓口
    public getAllEnemyDefinitions(): EnemyDefinition[] {
        return this.EnemiesList; // 全ての敵
    }

    public getAllPlayerDefinitions(): PlayerDefinition[] {
        return this.PlayersList; // 全てのプレイヤー
    }


    // ========================================================================
    // ======================= パーティのステータス一覧 =========================
    // ========================================================================

    // パーティの共通攻撃ロジック
    static CommonPartyAttack(enemy: IEnemyStatus, player: IPlayerStatus, manager: any) {
        enemy.hp -= player.atk;
        if (enemy.hp < 0) enemy.hp = 0; // マイナスはいかないように
        manager.setMessage(`${player.name} の攻撃！ ${player.atk} ダメージ！`);
    }
    
    private PlayersList: PlayerDefinition[] = [

        {   
            name: "戦士", 
            id: 1,
            hp: 150, 
            maxhp: 150,
            basehp: 150,
            atk: 18, 
            baseatk: 18, 
            invincible: 0,
            target: 0,
            Attack(enemy, manager){
                StatusData.CommonPartyAttack(enemy, this, manager);
            },
            Special(enemy, manager, players){
                players.forEach(player => {
                    player.invincible += 2;
                });
                manager.setMessage(`${this.name} は盾を構えた！ みんな +2ターン ムテキ！`);
            },
            image: "warriorImg" // pngのパスとしてmain.tsで定めた名称
        },

        {   
            name: "魔導士", 
            id: 2,
            hp: 100, 
            maxhp: 100,
            basehp: 100,
            atk: 1, 
            baseatk: 1, 
            invincible: 0,
            target: 0,
            Attack(enemy, manager){
                StatusData.CommonPartyAttack(enemy, this, manager);
            },
            Special(enemy, manager){
                enemy.hp -= this.atk * 3;
                if (enemy.hp < 0) enemy.hp = 0;
                manager.shuffleCost += 100;
                manager.setMessage(`シャッフルコストを生贄に呪文をとなえた！ ${this.atk * 3} ダメージ！`);
            },
            image: "mageImg"
        },

        {   
            name: "僧侶", 
            id: 3,
            hp: 520, 
            maxhp: 520,
            basehp: 520,
            atk: 5, 
            baseatk: 5, 
            invincible: 0,
            target: 0,
            Attack(enemy, manager){
                StatusData.CommonPartyAttack(enemy, this, manager);
            },
            Special(enemy, manager, players){
                players.forEach(player => {
                    player.hp += 200;
                    player.maxhp += 200;
                    player.atk += 15;
                });
                manager.setMessage(`${this.name} は杖を掲げた！ みんなのステータスがもろもろ強化！`);
            },
            image: "clericImg"
        },

        {   
            name: "盗賊", 
            id: 4,
            hp: 45, 
            maxhp: 45,
            basehp: 45,
            atk: 50, 
            baseatk: 50, 
            invincible: 0,
            target: 0,
            Attack(enemy, manager){
                StatusData.CommonPartyAttack(enemy, this, manager);
            },
            Special(enemy, manager){

                // ランダムゴールド生成ロジック
                // 一桁目は0固定にしたいから一桁目を除外した値を用意
                const minFactor = 50;
                const maxFactor = 150;
                
                // 50から200までのランダムな整数を生成
                const randomFactor = Math.floor(Math.random() * (maxFactor - minFactor + 1)) + minFactor;
                
                // 10倍して一の位を0にし、最終的なゴールド額を決定
                const bonusGold = randomFactor * 10;
                
                // CoreManagerのゴールドを更新
                manager.setMessage(`${this.name} は背後に忍び寄る！ ${bonusGold}G 盗んだ！`)
                manager.GOLD += bonusGold;
            },
            image: "thiefImg"
        },
    ];


    // ========================================================================
    // ========================= 敵のステータス一覧 =============================
    // ========================================================================


    // 敵の共通攻撃ロジック
    static CommonEnemyAttack(enemy: IEnemyStatus, players: IPlayerStatus[], manager: any) {
        players.forEach(player => {
            if(player.invincible > 0) return; // 無敵なら無視
            if(player.hp <= 0) return; // 死んでるなら無視
            player.hp -= enemy.atk; // ダメージ
            if(player.hp <= 0) player.hp = 0; // マイナスには行かないように
        });
    }

    // 敵Dxの共通攻撃ロジック
    static async CommonDxAttack(enemy: IEnemyStatus, players: IPlayerStatus[], manager: any) {
                for (const player of players) {
                    if(player.hp <= 0) continue;
                    if (player.invincible) 
                    {
                        player.invincible = 0; // ムテキであれば解除
                        manager.setMessage(`${player.name} は耐えたが  あまりの衝撃でムテキが剥がれた！`);
                    } 
                    else 
                    {
                        player.hp -= enemy.atk; // ムテキでなければダメージを追う
                        if (player.hp < 0) player.hp = 0;
                        manager.setMessage(`${player.name} に ${enemy.atk} ダメージ！`);
                    }
                    await manager.wait(2000);
                }
    }


    private EnemiesList: EnemyDefinition[] = [

        {   
            name: "スライム", 
            id: 1,
            hp: 30, 
            maxhp: 30,
            atk: 15, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の分裂攻撃！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {

                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                if (player.invincible) {
                    manager.setMessage(`${this.name} の急所づき！ ${player.name} はムテキでへっちゃらだ★`);
                } else {
                    player.hp -= this.atk * 5;
                    if(player.hp <= 0) player.hp = 0; // マイナスには行かないように
                    manager.setMessage(`${this.name} の急所づき！ ${player.name} に ${this.atk * 5} ダメージ！`);
                }
            },
            exp: 5, 
            gold: 100,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageImg",
            critical: 75, 
            image: 'slimeImg', 
            positionX: 390,
            positionY: 85,
            sizeX: 180,
            sizeY: 165
        },

        {   
            name: "ゴブリン", 
            id: 2,
            hp: 58, 
            maxhp: 58,
            atk: 24, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} は棒を振り回した！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                this.atk += 50;
                manager.setMessage(`${this.name} は奮い立たせ ATK を 50 あげた！`);
            },
            exp: 9, 
            gold: 130,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageImg",
            critical: 50, 
            image: 'goblinImg', 
            positionX: 400,
            positionY: 85,
            sizeX: 170,
            sizeY: 165
        },

        {   
            name: "キノコ", 
            id: 3,
            hp: 85, 
            maxhp: 85,
            atk: 48, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の荒ぶるヘドバン！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    if(player.invincible > 0) return;
                    if(player.hp <= 0) return;

                    const lossAmount = Math.floor(player.maxhp * 0.20);
                    player.maxhp -= lossAmount;

                    if(player.maxhp < player.hp) player.hp = player.maxhp; // 上限が残体力を下回ったら体力は上限に調整される
                    if(player.hp < 1) player.hp = 1; // 死ぬことは無い
                    if(player.maxhp < 1) player.maxhp = 1; // 死ぬことは無い
                });
                manager.setMessage(`${this.name} の胞子！ 勇者たちは HP上限 の 20% が減少した！`);
            },
            exp: 15, 
            gold: 210,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageImg",
            critical: 60, 
            image: 'kinokoImg', 
            positionX: 415,
            positionY: 85,
            sizeX: 150,
            sizeY: 165
        },

        {   
            name: "木", 
            id: 4,
            hp: 333, 
            maxhp: 333,
            atk: 88, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} は根っこを突き刺した！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                this.maxhp += 111;
                this.hp += 111;
                manager.setMessage(`${this.name} は栄養を蓄え HP上限 を 111 突破した!`);
            },
            exp: 9, 
            gold: 777,
            nowTurn: 5, 
            moveTurn: 5, 
            stage: "stageImg",
            critical: 40, 
            image: 'treantImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ゾンビ", 
            id: 5,
            hp: 123, 
            maxhp: 123,
            atk: 62, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} のもうれつビンタ！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    if(player.invincible > 0) return;
                    if(player.hp <= 0) return;

                    const lossAmount = Math.floor(player.atk * 0.20);
                    player.atk -= lossAmount;

                    if (player.atk < 1) player.atk = 1; // マイナスはいかないように 
                });
                manager.setMessage(`${this.name} のうめき声！ 勇者たちは ATK の 20% が減少した！`);
            },
            exp: 22, 
            gold: 330,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageImg",
            critical: 20, 
            image: 'zombieImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ミミック", 
            id: 6,
            hp: 1, 
            maxhp: 1,
            atk: 999, 
            Attack(players, manager) {
                
                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                if (player.invincible) {
                    manager.setMessage(`グサッッッッッッ！！ ${player.name} はムテキでへっちゃらだ★`);
                } else {
                    player.hp -= this.atk;
                    if(player.hp < 0) player.hp = 0; // マイナスには行かないように
                    manager.setMessage(`グサッッッッッッ！！ ${player.name} に ${this.atk} ダメージ！！！`);
                }
            },
            Special(players, manager) {
                this.Attack(players, manager);
            },
            exp: 10, 
            gold: 1000,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageImg",
            critical: 25, 
            image: 'mimicImg', 
            positionX: 390,
            positionY: 85,
            sizeX: 180,
            sizeY: 165
        },

        {   
            name: "ハナ", 
            id: 7,
            hp: 365, 
            maxhp: 365,
            atk: 1, 
            Attack(players, manager) {
                this.hp += 80;
                if(this.hp > this.maxhp) this.hp = this.maxhp; // 上限は超えないように
                manager.setMessage(`${this.name} は HP を 80 回復した!`);
            },
            Special(players, manager) {
                    if (this.nowTurn === 1 || this.moveTurn === 1) {
                        this.Attack(players, manager);
                    }
                    else { // この発動は一回だけにしたい
                        this.nowTurn = 1;
                        this.moveTurn = 1;
                        manager.setMessage(`${this.name} は素早くなった！ 行動ターン数が 1 に！`);
                    }
            },
            exp: 46, 
            gold: 340,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageImg",
            critical: 35, 
            image: 'hanaImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ゴーヤ", 
            id: 8,
            hp: 108, 
            maxhp: 108,
            atk: 1, 
            async Attack(players, manager) {
                await this.Special(players, manager);
            },
            async Special(players, manager) {

                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                // 特別なセリフ
                manager.setMessage(`${this.name} は自らを ${player.name} に差し出した！`);
                await manager.wait(3000);

                if (player.invincible) {
                    player.hp += 300;
                    player.maxhp += 300;
                    this.hp = 0;
                    manager.setMessage(`ムテキなので美味しく頂いた  HP上限 を 300 突破して回復！`);
                    await manager.wait(2000);
                } 
                else 
                {
                    player.hp = 0;
                    this.hp = 0;
                    manager.setMessage(`あまりの苦さに息絶えた`);
                    await manager.wait(2000);
                }
            },
            exp: 8, 
            gold: 108,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageImg",
            critical: 15, 
            image: 'goyaImg', 
            positionX: 410,
            positionY: 120,
            sizeX: 160,
            sizeY: 110
        },

        {   
            name: "ボーナスゾーン", 
            id: 9,
            hp: 1, 
            maxhp: 1,
            atk: 1, 
            Attack(players, manager) {
                this.hp = 0;
                manager.setMessage(`${this.name} は逃げ出した！`);
            },
            Special(players, manager) {
                manager.GOLD += 500;
                manager.setMessage(`${this.name} は GOLD をばらまいた！ 500G ゲット！`);
            },
            exp: 0, 
            gold: 2000,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageImg",
            critical: 50, 
            image: 'goldImg', 
            positionX: 425,
            positionY: 85,
            sizeX: 130,
            sizeY: 165
        },

        {   
            name: "ゴースト", 
            id: 10,
            hp: 75, 
            maxhp: 75,
            atk: 1, 
            Attack(players, manager) {
                const lossAmount = Math.floor(manager.GOLD * 0.20);
                manager.GOLD -= lossAmount;
                if (manager.GOLD < 0) manager.GOLD = 0;
                manager.setMessage(`${this.name} の呪い！ GOLD の 20% が消滅した！`);
            },
            Special(players, manager) {
                const lossAmount = Math.floor(manager.shuffleCost * 0.20);
                manager.shuffleCost += lossAmount;
                manager.setMessage(`${this.name} の呪い！ シャッフルコスト の 20% が増加した！`);
            },
            exp: 13, 
            gold: 250,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageImg",
            critical: 20, 
            image: 'ghostImg', 
            positionX: 390,
            positionY: 85,
            sizeX: 185,
            sizeY: 165
        },

        {   
            name: "ドラゴン", 
            id: 11,
            hp: 650, 
            maxhp: 650,
            atk: 370, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} のファイアブレス！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                    if (manager.handSize === 2) {
                        this.Attack(players, manager);
                    }
                    else { // この発動は一回だけにしたい
                        manager.handSize = 2;
                        manager.setMessage(`${this.name} のフリーズブレス！ 使えるカードが減らされた！`);
                    }
            },
            exp: 58, 
            gold: 1840,
            nowTurn: 8, 
            moveTurn: 8, 
            stage: "stageImg",
            critical: 12, 
            image: 'dragonImg', 
            positionX: 330,
            positionY: 85,
            sizeX: 320,
            sizeY: 165
        },

        {   
            name: "天使", 
            id: 12,
            hp: 320, 
            maxhp: 320,
            atk: 65, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の聖なる剣！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    if(player.hp <= 0) return; // 死んでたら無視
                    let temp = player.hp;
                    player.hp = player.atk;
                    player.maxhp = player.atk;
                    player.atk = temp;
                });
                manager.setMessage(`これは………幻？ HP と ATK が入れ替わった！`);
            },
            exp: 29, 
            gold: 1150,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageImg",
            critical: 10, 
            image: 'angelImg',
            positionX: 325,
            positionY: 75,
            sizeX: 320,
            sizeY: 180
        },




        
        // ========================================================================
        // ================================= EX ===================================
        // ========================================================================




        {   
            name: "スライムEx", 
            id: 13,
            hp: 200, 
            maxhp: 200,
            atk: 100, 
             Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の分裂攻撃！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {

                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                if (player.invincible) {
                    manager.setMessage(`${this.name} の急所づき！ ${player.name} はムテキでへっちゃらだ★`);
                } else {
                    player.hp -= this.atk * 8;
                    if(player.hp <= 0) player.hp = 0; // マイナスには行かないように
                    manager.setMessage(`${this.name} の急所づき！ ${player.name} に ${this.atk * 8} ダメージ！`);
                }
            },
            exp: 25, 
            gold: 500,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageExImg",
            critical: 50, 
            image: 'slimeExImg', 
            positionX: 400,
            positionY: 85,
            sizeX: 180,
            sizeY: 165
        },

        {   
            name: "ゴブリンEx", 
            id: 14,
            hp: 380, 
            maxhp: 380,
            atk: 240, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} は棒を振り回した！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                this.atk += 300;
                manager.setMessage(`${this.name} は奮い立たせ ATK を 300 あげた！`);
            },
            exp: 45, 
            gold: 800,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageExImg",
            critical: 35, 
            image: 'goblinExImg', 
            positionX: 400,
            positionY: 85,
            sizeX: 170,
            sizeY: 165
        },

        {   
            name: "キノコEx", 
            id: 15,
            hp: 550, 
            maxhp: 550,
            atk: 350, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の荒ぶるヘドバン！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    if(player.invincible > 0) return;
                    if(player.hp <= 0) return;

                    const lossAmount = Math.floor(player.maxhp * 0.50);
                    player.maxhp -= lossAmount;

                    if(player.maxhp < player.hp) player.hp = player.maxhp; // 上限が残体力を下回ったら体力は上限に調整される
                    if(player.hp < 1) player.hp = 1; // 死ぬことは無い
                    if(player.maxhp < 1) player.maxhp = 1; // 死ぬことは無い
                });
                manager.setMessage(`${this.name} の胞子！ 勇者たちは HP上限 の 50% が減少した！`);
            },
            exp: 75, 
            gold: 610,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageExImg",
            critical: 30, 
            image: 'kinokoExImg', 
            positionX: 415,
            positionY: 85,
            sizeX: 150,
            sizeY: 165
        },

        {   
            name: "木Ex", 
            id: 16,
            hp: 777, 
            maxhp: 777,
            atk: 888, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} は根っこを突き刺した！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                this.maxhp += 888;
                this.hp += 888;
                manager.setMessage(`${this.name} は栄養を蓄え HP上限 を 555 突破した!`);
            },
            exp: 44, 
            gold: 1111,
            nowTurn: 6, 
            moveTurn: 6, 
            stage: "stageExImg",
            critical: 20, 
            image: 'treantExImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ゾンビEx", 
            id: 17,
            hp: 321, 
            maxhp: 321,
            atk: 640, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} のもうれつビンタ！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    if(player.invincible > 0) return;
                    if(player.hp <= 0) return;

                    const lossAmount = Math.floor(player.atk * 0.50);
                    player.atk -= lossAmount;

                    if (player.atk < 1) player.atk = 1; // マイナスはいかないように 
                });
                manager.setMessage(`${this.name} のうめき声！ 勇者たちは ATK の 50% が減少した！`);
            },
            exp: 110, 
            gold: 870,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageExImg",
            critical: 10, 
            image: 'zombieExImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ミミックEx", 
            id: 18,
            hp: 111, 
            maxhp: 111,
            atk: 9999, 
            Attack(players, manager) {
                
                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                if (player.invincible) {
                    manager.setMessage(`グサッッッッッッ！！ ${player.name} はムテキでへっちゃらだ★`);
                } else {
                    player.hp -= this.atk;
                    if(player.hp < 0) player.hp = 0; // マイナスには行かないように
                    manager.setMessage(`グサッッッッッッ！！ ${player.name} に ${this.atk} ダメージ！！！`);
                }
            },
            Special(players, manager) {
                this.Attack(players, manager);
            },
            exp: 50, 
            gold: 2000,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageExImg",
            critical: 15, 
            image: 'mimicExImg', 
            positionX: 390,
            positionY: 85,
            sizeX: 180,
            sizeY: 165
        },

        {   
            name: "ハナEx", 
            id: 19,
            hp: 650, 
            maxhp: 650,
            atk: 1000, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
            },
            Special(players, manager) {
                if (this.nowTurn === 1 || this.moveTurn === 1) {
                    StatusData.CommonEnemyAttack(this, players, manager);
                }
                else {
                    // この発動は一回だけにしたい
                    this.nowTurn = 1;
                    this.moveTurn = 1;
                    manager.setMessage(`${this.name} は素早くなった！ 行動ターン数が 1 に！`);
                }
            },
            exp: 120, 
            gold: 670,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageExImg",
            critical: 10, 
            image: 'hanaExImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 160,
            sizeY: 165
        },

        {   
            name: "ゴーヤEx", 
            id: 20,
            hp: 801, 
            maxhp: 801,
            atk: 1, 
            async Attack(players, manager) {
                await this.Special(players, manager);
            },
            async Special(players, manager) {

                // 生きているプレイヤーをフィルタリングする
                const livingPlayers = players.filter(player => player.hp > 0);

                // 生きているプレイヤーがいない場合は処理を終了する
                if (livingPlayers.length === 0) return;

                // フィルタリングされたリストからランダムなインデックスを選択
                const randomIndex = Math.floor(Math.random() * livingPlayers.length);
    
                // ランダムに選ばれたプレイヤーを取得
                const player = livingPlayers[randomIndex];

                // 特別なセリフ
                manager.setMessage(`${this.name} は自らを ${player.name} に差し出した！`);
                await manager.wait(3000);

                if (player.invincible) {
                    player.hp += 500;
                    player.maxhp += 500;
                    this.hp = 0;
                    manager.setMessage(`ムテキなので美味しく頂いた  HP上限 を 500 突破して回復！`);
                    await manager.wait(2000);
                } 
                else 
                {
                    player.hp = 0;
                    this.hp = 0;
                    manager.setMessage(`あまりの苦さに息絶えた`);
                    await manager.wait(2000);
                }
            },
            exp: 18, 
            gold: 1080,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageExImg",
            critical: 5, 
            image: 'goyaExImg', 
            positionX: 450,
            positionY: 100,
            sizeX: 70,
            sizeY: 150
        },

        {   
            name: "ボーナスゾーンEx", 
            id: 21,
            hp: 1, 
            maxhp: 1,
            atk: 1, 
            Attack(players, manager) {
                this.hp = 0;
                manager.setMessage(`${this.name} は逃げ出した！`);
            },
            Special(players, manager) {
                manager.EXP += 50;
                manager.setMessage(`${this.name} はEXPをばらまいた！ 50EXP ゲット！`);
            },
            exp: 300, 
            gold: 0,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageExImg",
            critical: 50, 
            image: 'expImg', 
            positionX: 410,
            positionY: 85,
            sizeX: 170,
            sizeY: 165
        },

        {   
            name: "ゴーストEx", 
            id: 22,
            hp: 750, 
            maxhp: 750,
            atk: 1, 
            Attack(players, manager) {
                const lossAmount = Math.floor(manager.GOLD * 0.50);
                manager.GOLD -= lossAmount;
                if (manager.GOLD < 0) manager.GOLD = 0;
                manager.setMessage(`${this.name} の呪い！ GOLD の 50% が消滅した！`);
            },
            Special(players, manager) {
                const lossAmount = Math.floor(manager.shuffleCost * 0.50);
                manager.shuffleCost += lossAmount;
                manager.setMessage(`${this.name} の呪い！ シャッフルコスト の 50% が増加した！`);
            },
            exp: 65, 
            gold: 900,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageExImg",
            critical: 5, 
            image: 'ghostExImg', 
            positionX: 400,
            positionY: 85,
            sizeX: 185,
            sizeY: 165
        },

        {   
            name: "ドラゴンEx", 
            id: 23,
            hp: 4500, 
            maxhp: 4500,
            atk: 3700, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} のファイアブレス！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                    if (manager.handSize === 1) {
                        this.Attack(players, manager);
                    }
                    else { // この発動は一回だけにしたい
                        manager.handSize = 1;
                        manager.setMessage(`${this.name} のフリーズブレス！ 使えるカードが減らされた！`);
                    }
            },
            exp: 190, 
            gold: 4300,
            nowTurn: 8, 
            moveTurn: 8, 
            stage: "stageExImg",
            critical: 5, 
            image: 'dragonExImg', 
            positionX: 330,
            positionY: 85,
            sizeX: 320,
            sizeY: 165
        },

        {   
            name: "天使Ex", 
            id: 24,
            hp: 2100, 
            maxhp: 2100,
            atk: 600, 
            Attack(players, manager) {
                StatusData.CommonEnemyAttack(this, players, manager);
                manager.setMessage(`${this.name} の魔なる剣！ 全員に ${this.atk} ダメージ！`);
            },
            Special(players, manager) {
                players.forEach(player => {
                    let temp = player.hp;
                    player.hp = player.atk;
                    player.maxhp = player.atk;
                    player.atk = temp;
                });
                manager.setMessage(`これは………幻？ HP と ATK が入れ替わった！`);
            },
            exp: 145, 
            gold: 3110,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageExImg",
            critical: 3, 
            image: 'angelExImg',
            positionX: 325,
            positionY: 75,
            sizeX: 320,
            sizeY: 180
        },



        // ========================================================================
        // ================================= DX ===================================
        // ========================================================================



        {   
            name: "戦士Dx", 
            id: 25,
            hp: 3500, 
            maxhp: 3500,
            atk: 1200, 
            async Attack(players, manager) {
                manager.setMessage(`${this.name} の居合斬り！`);
                await manager.wait(2500);
                await StatusData.CommonDxAttack(this, players, manager);
                if(manager.handSize > 1){
                    manager.handSize -= 1;
                    manager.setMessage(`さらに、カードまで斬られてしまった！`);
                }
            },
            async Special(players, manager) {
                if (manager.handSize === 1){
                    manager.handSize += 2;
                    const lossAmount = Math.floor(manager.shuffleCost * 0.70);
                    manager.shuffleCost += lossAmount;
                    manager.setMessage(`カードが増えたが シャッフルコスト の 70% が増加した！`);
                }
                else{
                    await this.Attack(players, manager)
                }
            },
            exp: 500, 
            gold: 5000,
            nowTurn: 3, 
            moveTurn: 3, 
            stage: "stageDxImg",
            critical: 1, 
            image: 'warriorDxImg',
            positionX: 400,
            positionY: 85,
            sizeX: 150,
            sizeY: 170
        },

        {   
            name: "魔導士Dx", 
            id: 26,
            hp: 2000, 
            maxhp: 2000,
            atk: 500, 
            async Attack(players, manager) {
                await this.Special(players, manager);
            },
            async Special(players, manager) {
                manager.setMessage(`${this.name} の ビッグバン×2 ！`);
                await manager.wait(2500);
                await StatusData.CommonDxAttack(this, players, manager);
                await StatusData.CommonDxAttack(this, players, manager);
                if(this.moveTurn > 1){
                    this.moveTurn -= 1;
                    this.nowTurn = this.moveTurn;
                    this.atk += 300;
                    manager.setMessage(`${this.name} は ATK を高めた！ さらに行動ターン数も短縮！`);
                }
            },
            exp: 500, 
            gold: 5000,
            nowTurn: 5, 
            moveTurn: 5, 
            stage: "stageDxImg",
            critical: 1, 
            image: 'mageDxImg',
            positionX: 400,
            positionY: 85,
            sizeX: 150,
            sizeY: 170
        },

        {   
            name: "僧侶Dx", 
            id: 27,
            hp: 5000, 
            maxhp: 5000,
            atk: 150, 
            async Attack(players, manager) {
                manager.setMessage(`${this.name} の シャイニング！`);
                await manager.wait(2500);
                await StatusData.CommonDxAttack(this, players, manager);
                players.forEach(player => {
                    if(player.hp <= 0 ) return;
                    let temp = player.hp;
                    player.hp = player.atk;
                    player.maxhp = player.atk;
                    player.atk = temp;
                });
                manager.setMessage(`めまいがする…  ATK と HP が入れ替わっていた！`);
            },
            Special(players, manager) {
                this.hp += 750;
                this.maxhp += 750;
                this.atk += 300;
                manager.setMessage(`${this.name} は杖を掲げた！ ステータスがもろもろ強化！`);
            },
            exp: 500, 
            gold: 5000,
            nowTurn: 2, 
            moveTurn: 2, 
            stage: "stageDxImg",
            critical: 1, 
            image: 'clericDxImg',
            positionX: 400,
            positionY: 85,
            sizeX: 150,
            sizeY: 170
        },

        {   
            name: "盗賊Dx", 
            id: 28,
            hp: 800, 
            maxhp: 800,
            atk: 4500, 
            async Attack(players, manager) {
                manager.setMessage(`${this.name} のなぎ払い！`);
                await manager.wait(2500);
                await StatusData.CommonDxAttack(this, players, manager);
            },
            async Special(players, manager) {
                manager.GOLD -= 1200;
                if (manager.GOLD < 0) manager.GOLD = 0;
                manager.setMessage(`${this.name} は背後に忍び寄る！ 1200G 盗まれた！`);

                await manager.wait(2500);
                manager.setMessage(`さらに  盗んだ GOLD で「にがいやくそう」を使ってきた！`);
                await manager.wait(2500);

                players.forEach(player => {
                    if(player.invincible <= 0) player.atk = Math.floor(player.atk / 2);
                    if(player.atk < 1) player.atk = 1; // 1までにとどめる
                });
                manager.setMessage(`にっがーーーーーーーー！ 勇者たち の ATK が半減された`);
            },
            exp: 500, 
            gold: 5000,
            nowTurn: 1, 
            moveTurn: 1, 
            stage: "stageDxImg",
            critical: 1, 
            image: 'thiefDxImg',
            positionX: 395,
            positionY: 85,
            sizeX: 160,
            sizeY: 170
        },


    ];
}