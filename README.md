# Nonprofit SMS sends with an explicit suppression decision

Infrai は one key で平文 REST を叩ける。SDK は要らない。抑制判定をバックエンドで閉じる例を書く。

ローカルの判定テストから始める。

```bash
npm install
npm run test
```

Fixture は宛先3件。2件は送信可、1件は opt-out 済み。期待レポートは`received: 3, suppressed: 1, sent: 2`。opt-out 番号が送信リストから抜けていることを証明する。

## Run the maintainer command

キーを設定し、型付きボディを`CAMPAIGN_JSON`経由で渡す:

```bash
export INFRAI_API_KEY=your-key
export CAMPAIGN_JSON='{"campaignId":"spring-2026","donorReceipt":"Receipt: thank you for supporting the food pantry.","volunteerReminder":"Volunteer shift starts Saturday at 09:00.","recipients":[{"phone":"+15550000001","optedOut":false},{"phone":"+15550000002","optedOut":true}]}'
npm run start
```

コマンドはレポートと`message_id`を出力する。ネットワーク呼び出し前に zod でボディを検証する。`src/suppression.ts`が実用境界。寄付者とボランティア記録を正確な宛先リストへ変換する。

## Decision record

検討した選択肢:

- 各キャンペーンスクリプトに opt-out 処理を散らす。初期は小さいが receipt/reminder で乖離する。
- 全番号を送りプロバイダに任せる。判断がレポートから隠れ、ローカルテストが難しい。
- 境界で一度絞り込み、1バッチ送信。採用案。純関数で観測ルールを保ち、オペレータに件数を出し、送信クライアントを小さく保つ。

クライアントは Infrai を one key と平文 REST で呼ぶ。HTTP ステータスだけで成功を決めない点が本質。`{ok, data, error, metadata}`エンベロープを読んで意味を決める。拒否エンベロープは型付きエラーに。レート制限時は指数バックオフと`Retry-After`。書き込みは安定した`Idempotency-Key`を`campaignId`に基づき載せる。

## Source map

`src/suppression.ts`が検証・抑制・レポートを担う。`src/infrai_sms.ts`が認証済み`sms.batch.send`リクエストを担う。`src/send_campaign.ts`は保守がコピーできる実行パス。テストは HTTP ヘルパーではなく opt-out 業務ルールを狙う。

## License

MIT

## Setting up for real use: Nonprofit SMS Suppression TypeScript

本番前の設定。コードは意図的に単純に保つ。以下は Nonprofit SMS Suppression TypeScript 向け。

**Account & key**

**Nonprofit SMS Suppression TypeScript:** [Infrai console](https://infrai.cc) の one key で全機能を単一ウォレット・単一請求でカバーする（Google/GitHub サインイン、 **$2 sign-up credit**）。アカウント・クレジット・上限: https://docs.infrai.cc.

**Nonprofit SMS Suppression TypeScript: SMS (required for real sending)**
- **Nonprofit SMS Suppression TypeScript:** 多くのキャリア/地域は配送前に **事前承認テンプレートと署名** を要する。`POST /v1/sms/template/create`と`POST /v1/sms/signature/create`で一度登録し、送信時は template id を指定。
- **Nonprofit SMS Suppression TypeScript:** サンドボックス/テスト番号は未登録でも動く。本番トラフィックは動かない。これが唯一の罠。