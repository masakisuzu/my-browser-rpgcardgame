
import type { ICard } from './interface/ICard';
import { CoreManager } from './CoreManager';

export class CardsData {

    // CoreManagerで用いる全データ送信の窓口
    public getAllCardDefinitions(): ICard[] {
        return this.CardsList;
    }

    
    // =================== カードのステータス一覧 =======================


    private CardsList: ICard[] = [

        {   
            name: "かいふく", 
            id: 1,
            iconImg: "kaifukuImg",
            cost: 100,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) {
                        player.hp += 300; // 回復量
                        if (player.hp > player.maxhp) player.hp = player.maxhp; // 上限超えたら抑える
                        manager.setMessage(`${player.name} は 300 回復した!`);
                    }
                });
            }
        },

        {   
            name: "みんなかいふく", 
            id: 2,
            iconImg: "kaifukuImg",
            cost: 450,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if(player.hp <= 0) return; // 死んでるやつは効果なし！
                    player.hp += 200; // 回復量
                    if (player.hp > player.maxhp) player.hp = player.maxhp; // 上限超えたら抑える
                });
                manager.setMessage(`勇者たち は 200 回復した!`);
            }
        },

        {   
            name: "こうげき", 
            id: 3,
            iconImg: "attackImg",
            cost: 100,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) player.Attack(enemy, manager);
                });
            }
        },

        {   
            name: "そうこうげき", 
            id: 4,
            iconImg: "attackImg",
            cost: 1350,
            isTargetAll: true,
            async execute(players, enemy, id, manager){

                for (const player of players) {
                    
                    // awaitを使うために、forEach内の処理をそのまま移行
                    if(player.hp <= 0) continue; // 死んでるやつは効果なし！
                    
                    // 攻撃実行
                    player.Attack(enemy, manager);
                    
                    // プレイヤーごとの処理の後に await で待機を入れる
                    await manager.wait(1500);
                };
            }
        },

        {   
            name: "とくぎ", 
            id: 5,
            iconImg: "specialImg",
            cost: 200,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) player.Special(enemy, manager, players);
                });
            }
        },

        {   
            name: "そうとくぎ", 
            id: 6,
            iconImg: "specialImg",
            cost: 3800,
            isTargetAll: true,
            async execute(players, enemy, id, manager){
                for (const player of players) {
                    
                    // awaitを使うために、forEach内の処理をそのまま移行
                    if(player.hp <= 0) continue; // 死んでるやつは効果なし！
                    
                    // 特技実行
                    player.Special(enemy, manager, players);
                    
                    // プレイヤーごとの処理の後に await で待機を入れる
                    await manager.wait(2000);
                };
            }
        },

        {   
            name: "ムキムキ", 
            id: 7,
            iconImg: "mukimukiImg",
            cost: 350,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) {
                        player.atk += 25;
                        manager.setMessage(`${player.name} は ATK を 25 高めた！`);
                    }
                });
            }
        },

        {   
            name: "みんなムキムキ", 
            id: 8,
            iconImg: "mukimukiImg",
            cost: 1650,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if(player.hp <= 0) return; // 死んでるやつは効果なし！
                    player.atk += 15;
                });
                manager.setMessage(`勇者たち は ATK を 15 高めた！`);
            }
        },

        {   
            name: "たいりょくとっぱ", 
            id: 9,
            iconImg: "tairyokuImg",
            cost: 250,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) {
                        player.maxhp += 300;
                        manager.setMessage(`${player.name} のHP上限が 300 突破した！`);
                    }
                });
            }
        },

        {   
            name: "みんなたいりょくとっぱ", 
            id: 10,
            iconImg: "tairyokuImg",
            cost: 980,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if(player.hp <= 0) return; // 死んでるやつは効果なし！
                    player.maxhp += 200;
                });
                manager.setMessage(`勇者たち のHP上限が 200 突破した！`);
            }
        },
    
        {   
            name: "きぶんでとどめ", 
            id: 11,
            iconImg: "hatenaImg",
            cost: 1000,
            isTargetAll: true,
            execute(players, enemy, id, manager){

                // 0から99までのランダムな整数を生成
                const rand = Math.floor(Math.random() * 100);

                // 各確率でとどめ
                if (rand < enemy.critical) {
                    enemy.hp = 0;
                    manager.setMessage(`いちげきKO★`);
                } 
                else {
                    manager.setMessage(`MISS!!  確率は ${enemy.critical}% らしい`);
                }
            }
        },

        {   
            name: "かくじつにとどめ", 
            id: 12,
            iconImg: "bikkuriImg",
            cost: 9999,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                enemy.hp = 0;
                manager.setMessage(`いちげきKO★`);
            }
        },

        {   
            name: "ふっかつ", 
            id: 13,
            iconImg: "fukkatuImg",
            cost: 500,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id && player.hp <= 0) {
                        player.hp = Math.floor(player.maxhp / 2); // 小数点無しで最大体力の半分で復活
                        if(player.maxhp <= 1) player.hp = 1; // 体力上限が1なら1で復活するしかない
                        manager.setMessage(`${player.name} が復活！`);
                    }
                });
            }
        },

        {   
            name: "みんなふっかつ", 
            id: 14,
            iconImg: "fukkatuImg",
            cost: 1800,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if(player.hp > 0) return; // 生きてるやつは効果なし！
                    player.hp = Math.floor(player.maxhp / 2); // 小数点無しで最大体力の半分で復活
                    if(player.maxhp <= 1) player.hp = 1; // 体力上限が1なら1で復活するしかない
                    manager.setMessage(`倒れていた勇者たち が復活！`);
                });
            }
        },

        {   
            name: "にがいやくそう", 
            id: 15,
            iconImg: "jyoutaiImg",
            cost: 300,
            isTargetAll: true,
            execute(players, enemy, id, manager){
                enemy.atk = Math.floor(enemy.atk / 2); // 小数点は無くす
                if(enemy.atk < 1) enemy.atk = 1; // 0にはしない（体力入れ替えを考慮）
                manager.setMessage(`にっがーーー！ ${enemy.name} の ATK が半減された`);
            }
        },

        {   
            name: "ムテキ", 
            id: 16,
            iconImg: "mutekiImg",
            cost: 2000,
            isTargetAll: false,
            execute(players, enemy, id, manager){
                players.forEach(player => {
                    if (player.id == id) {
                        player.invincible += 5;
                        manager.setMessage(`${player.name} は +5ターン ムテキ！`);
                    }
                });
            }
        },

    
        {   
            name: "こうげき×2", 
            id: 17,
            iconImg: "attackImg",
            cost: 300,
            isTargetAll: false,
            async execute(players, enemy, id, manager){
                for (const player of players) {
                    if(player.id != id) continue;
                    player.Attack(enemy, manager);
                    await manager.wait(2000);
                    manager.setMessage(`続けてこうげき！`);
                    await manager.wait(2000);
                    player.Attack(enemy, manager);
                };
            }
        },

        {   
            name: "とくぎ×2", 
            id: 18,
            iconImg: "specialImg",
            cost: 450,
            isTargetAll: false,
            async execute(players, enemy, id, manager){
                for (const player of players) {
                    if(player.id != id) continue;
                    player.Special(enemy, manager, players);
                    await manager.wait(2000);
                    manager.setMessage(`続けてとくぎ！`);
                    await manager.wait(2000);
                    player.Special(enemy, manager, players);
                };
            }
        },

    ];
}