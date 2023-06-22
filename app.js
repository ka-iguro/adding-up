'use strict';
// モジュール呼び出し： require使用。'node:fs': filestream（ファイル読み込み)、'node:readline': csvの読み込み
const fs = require('node:fs');
const readline = require('node:readline');

const rs = fs.createReadStream('./popu-pref.csv');
const rl = readline.createInterface({ input: rs });

const prefectureDataMap = new Map(); // key: 都道府県 value: 集計結果の"オブジェクト"

// ファイル読み込みは、時間がかかる処理だから非同期らしい。Streamは非同期処理で実装されている。
// 時間がかかる処理は、イベントが発生したときに実行される処理を設定しておく。。→イベント駆動型プログラミング

// rl.on: 'rl'オブジェクトで、'line'というイベントが発生したら、この無名関数を呼べ、という意味
// lineString: 'line'イベントから得られる値。それを無名関数の引数として渡している => （アロー）
// 無名関数の中身は、'line'イベントの結果の値をコンソールに出力する、という処理
rl.on('line', lineString => {
    // ファイルから１行ずつ読み出し、これをコンソール出力する
    // console.log(lineString); // lineString: 読み込んだときの１行(string)

    const columns = lineString.split(','); // １行は文字列として扱われている？','でsplitすることで配列として格納される？
    // columnsっていう名前ゴミじゃない？カラム名が入ってて欲しいんだけど。

    const year = parseInt(columns[0]); // 0番目のカラムは、集計年なので。parseInt: 文字列から数値への変換
    const prefecture = columns[1]; // 都道府県
    const popu = parseInt(columns[3]); // 対象の年齢である、15 ~ 19歳の人口

    let value = null;

    // console.log('年:', year, '都道府県:', prefecture, '15~19歳人口:', popu);

    // 2016 or 2021年が対象
    if (year === 2016 || year === 2021) {
        
        let value = null; // value: before, after, change の3つのプロパティを持ったオブジェクト
        if (prefectureDataMap.has(prefecture)){
            // 一度、人口を格納したことがある都道府県については、valueを呼び出す
            value = prefectureDataMap.get(prefecture);
        } else {
            // 一度も人口を格納したことがない都道府県については、valueを初期化する
            value = {
                before: 0,
                after: 0,
                change: null
            };
        }
        if (year === 2016) {
            value.before = popu;
        }
        if (year === 2021) {
            value.after = popu;
        }
        prefectureDataMap.set(prefecture, value); // 格納
    }
});

// ファイルを閉じた時（読み込みが全て終わった時、自動的に閉じる？）
rl.on('close', () => {
    // 人口データの変化前、変化後が揃ったので、変化率を計算する
    // 辞書型の各要素に対する for ってこんな感じなんだ。constなんだ。

    // constが縛るのは、「再代入」だけ。値は不変ではなく、プロパティの操作も可能。
    // 値を不変にするときは、Object.freeze(val) のようにする。valにあらゆる変更ができなくなる

    for (const [key, value] of prefectureDataMap) {
        value.change = value.after / value.before;
    }

    // 2016、2019、変化率の出力（ソートされていない）
    // console.log(prefectureDataMap);

    // Array.from(辞書型配列): これの返り値は？
    // console.log(Array.from(prefectureDataMap)); // ← [['北海道', {before: ~, after: ~, change: ~}], ['沖縄', {before ~~~}]]
    // というように、[key, value]がたくさん入った配列が出てくる。２次元配列。自由すぎてよく分からん。

    // (Array).sort(関数): どういう処理だ？
    // sort()メソッドに渡す関数は、比較関数といい、これによって並び替えをするルールを決めることができる
    // 比較関数は、2つの引数（前者の引数をpair1, 後者の引数をpair2）を受け取って処理した結果が、
    // - 負の整数なら、pair1を前に置く
    // - 正の整数なら、pair2を後ろに置く
    // - 0 なら並びは変わらない

    // sort()だと、文字列の昇順でソートをする。
    // const numbers = [20, 10, 1, 22, 3, 5];
    // numbers.sort();
    // console.log(numbers); // → [1, 10, 20, 22, 3, 5];　← どの数も文字列として扱われているため、先頭の文字が1, 2, 3, ..., 5
    // のようにソートする。値の大きさはガン無視。

    // numbers.sort((a, b) => {
    //     return a < b ? -1 : 1; // ← ??????
    // });

    const rankingArray = Array.from(prefectureDataMap).sort((pair1, pair2) => {
        // 比較関数。この中身が負 or 正で並び替えのアルゴリズムが変わる
        return pair2[1].change - pair1[1].change;
    });

    // map: 各要素に関数を適用し、新しい配列を作る。
    // この場合、rankingArrayの中身一つ一つの中身を使って
    const rankingStrings = rankingArray.map(([key, value]) => {
        return `${key}: ${value.before} => ${value.after} 変化率: ${value.change}`;
    });
    
    console.log(rankingStrings);
})


/**
 * 2016 ~ 2021年にかけて、15~19歳の人が増えた割合の都道府県ランキング
 * 1. ファイルからデータを読み込む
 * 2. 2016年と2021年のデータを選ぶ
 * 3. 都道府県ごとの変化率を計算
 * 4. 変化率ごとに並べる
 * 5. 並べられたものを表示する
 */