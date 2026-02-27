# データ移行手順

## 前提条件

1. Firebase プロジェクトが作成済み
2. Firebase Admin SDK の認証情報（サービスアカウントキー）を取得済み
3. MySQL データベースへのアクセス権限
4. Lightsail インスタンスへの SSH アクセス権限

## ステップ1: MySQLからデータをエクスポート

### 1-1. SSH接続してMySQLダンプを取得

```bash
# Lightsailインスタンスに接続
ssh user@your-lightsail-instance

# MySQLデータをJSON形式でエクスポート
mysql -u root -p denshi_kessan_production -e \
  "SELECT * FROM users" \
  | ./scripts/mysql_to_json.sh > users.json

mysql -u root -p denshi_kessan_production -e \
  "SELECT * FROM company_informations" \
  | ./scripts/mysql_to_json.sh > companies.json

mysql -u root -p denshi_kessan_production -e \
  "SELECT * FROM electronic_public_notices" \
  | ./scripts/mysql_to_json.sh > notices.json

mysql -u root -p denshi_kessan_production -e \
  "SELECT * FROM user_subscription_plans" \
  | ./scripts/mysql_to_json.sh > subscriptions.json
```

### 1-2. PDFファイルをtarで固める

```bash
cd /var/www/denshi-kessan-koukoku/shared/public/storage/
tar -czf ~/pdfs_backup.tar.gz .
```

### 1-3. ローカルにダウンロード

```bash
# ローカルマシンで実行
scp user@your-lightsail-instance:~/users.json ./migration-data/
scp user@your-lightsail-instance:~/companies.json ./migration-data/
scp user@your-lightsail-instance:~/notices.json ./migration-data/
scp user@your-lightsail-instance:~/subscriptions.json ./migration-data/
scp user@your-lightsail-instance:~/pdfs_backup.tar.gz ./migration-data/
```

## ステップ2: Firebase Admin SDKのセットアップ

```bash
npm install --save-dev firebase-admin
```

## ステップ3: サービスアカウントキーを配置

```bash
# Firebase Console > Project Settings > Service Accounts
# 「Generate new private key」でダウンロード

cp ~/Downloads/serviceAccountKey.json ./scripts/migration/
```

## ステップ4: データ移行スクリプトを実行

```bash
# 1. ユーザーデータを移行（Firebase Authユーザー作成含む）
npm run migrate:users

# 2. 企業情報を移行
npm run migrate:companies

# 3. サブスクリプション情報を移行
npm run migrate:subscriptions

# 4. PDFファイルをStorageにアップロード
npm run migrate:pdfs

# 5. 決算公告メタ情報を移行
npm run migrate:notices
```

## ステップ5: データ検証

```bash
npm run verify:migration
```

## ステップ6: 価格改定後の既存契約者データ移行

価格改定を行った後、既存契約者が旧価格で継続できるようにデータを更新します。

### 前提条件
- `.env.local` に `PAYJP_SECRET_KEY` が設定済み
- Firebase Admin SDK が正しく設定済み

### 実行方法

```bash
# 既存契約者のサブスクリプションプランをレガシープランに更新
node scripts/migration/update-legacy-subscriptions.js
```

このスクリプトは以下の処理を行います：
1. 全ユーザーのサブスクリプション情報を取得
2. Pay.jpから実際の契約情報を取得して価格を確認
3. 旧価格（1年: ¥980、5年: ¥3,920）の契約者を識別
4. `subscriptionPlanId` を `1year_legacy` または `5year_legacy` に更新
5. `actualPrice` フィールドに実際の契約価格を保存

### 実行結果の例

```
既存契約者のデータ移行を開始します...

ユーザー abc123: サブスクリプションID sub_xxx, プランID yearly_plan_980
✅ ユーザー abc123: 1year → 1year_legacy (980円) に更新しました

ユーザー def456: チャージID ch_yyy, 金額 3920円
✅ ユーザー def456: 5year → 5year_legacy (3920円) に更新しました

ユーザー ghi789: 新価格プラン（更新不要）

=== 移行完了 ===
更新: 2件
スキップ: 1件
エラー: 0件
合計: 3件
```

## 注意事項

- **本番データのバックアップを必ず取得してから実行**
- 移行中は旧システムを読み取り専用にすることを推奨
- Firebase の無料枠に注意（特にStorage容量とFirestore書き込み数）
- payjp_customer_id などの決済情報は慎重に扱う
- 価格改定後は既存契約者の自動更新が旧価格で継続されることを確認
