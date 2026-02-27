# データ移行手順

旧サイト（Rails + MySQL + Lightsail ローカルストレージ）から  
新サイト（Next.js + Firebase Auth + Firestore + Firebase Storage）へのデータ移行手順です。

---

## 全体フロー

```
旧サイト（Lightsail）
  ↓ ① rake migration:export  →  tmp/migration_export/
  ↓ ② scp でローカルにダウンロード  →  migration-data/
新サイト（このリポジトリ）
  ↓ ③ migrate-users.js        → Firebase Auth + /users/{uid}
  ↓ ④ migrate-companies.js    → /users/{uid}/company_information
  ↓ ⑤ migrate-subscriptions.js → /users/{uid}/subscription_plans
  ↓ ⑥ migrate-notices.js      → Firebase Storage + /electronic_public_notices
  ↓ ⑦ verify-migration.js     → 件数・整合性チェック
```

---

## Firestore コレクション設計

| MySQL テーブル               | Firestore パス                                      |
| ----------------------------- | --------------------------------------------------- |
| users                         | `/users/{uid}`                                      |
| company_informations          | `/users/{uid}/company_information/{docId}`          |
| user_subscription_plans       | `/users/{uid}/subscription_plans/{legacyId}`        |
| electronic_public_notices     | `/electronic_public_notices/{uuid}`                 |
| Active Storage（PDF）         | Firebase Storage `notices/{uid}/{uuid}.pdf`         |

---

## 事前準備

### 1. Firebase プロジェクトの設定確認
- Firebase Console でプロジェクトを作成済みであること
- Authentication（メール/パスワード）を有効化
- Firestore Database を作成
- Storage を作成

### 2. サービスアカウントキーを配置

```bash
# Firebase Console > プロジェクト設定 > サービスアカウント
# 「新しい秘密鍵の生成」でダウンロード
cp ~/Downloads/serviceAccountKey.json scripts/migration/serviceAccountKey.json
```

### 3. migrate-notices.js の Storage バケット名を設定

`scripts/migration/migrate-notices.js` の以下の行を実際のプロジェクト ID に修正するか、
環境変数で指定します。

```bash
export FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 4. 依存パッケージのインストール

```bash
npm install
```

---

## ステップ 1: 旧サイトからデータをエクスポート

Lightsail サーバにて：

```bash
# Rails アプリのルートで実行
bundle exec rake migration:export
# → tmp/migration_export/ に出力される
```

### ローカルにダウンロード（Mac で実行）

```bash
scp -r -i ~/.ssh/your-key.pem \
  ubuntu@xxx.xxx.xxx.xxx:/var/www/your-app/tmp/migration_export/ \
  ~/Desktop/migration_export/
```

`~/Desktop/migration_export/` の構成：

```
~/Desktop/migration_export/
  ├── users.json
  ├── company_informations.json
  ├── electronic_public_notices.json
  ├── user_subscription_plans.json
  └── pdfs/
        ├── {uuid}.pdf
        └── ...
```

---

## ステップ 2: 移行スクリプトを実行（順番通りに）

```bash
# 1. ユーザー（Firebase Auth + Firestore /users/{uid}）
npm run migrate:users
# → scripts/migration/uid-mapping.json が生成される（後続スクリプトが参照）

# 2. 企業情報（/users/{uid}/company_information）
npm run migrate:companies

# 3. サブスクリプション（/users/{uid}/subscription_plans）
npm run migrate:subscriptions

# 4. 決算公告 + PDF（Firebase Storage + /electronic_public_notices）
npm run migrate:notices

# 5. 検証（件数・整合性チェック）
npm run verify:migration
```

> ⚠️ **実行順序は必ず守ってください。**  
> `migrate-users.js` が生成する `uid-mapping.json` を後続スクリプトが参照します。

---

## ステップ 3: パスワードを引き継ぐ

旧サイト（Sorcery）のBCryptハッシュをそのまま Firebase Auth にインポートします。  
ユーザーは**旧サイトと同じパスワードでログイン可能**になります。

```bash
# 旧サイトで暗号化パスワードをエクスポート
bundle exec rake migration:export_passwords
# → tmp/migration_export/encrypted_passwords.json

# Mac にコピー後、インポート実行
npm run import:passwords
```

---

## ステップ 4: 価格改定後の既存契約者データ移行（必要な場合）

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

---

## 注意事項

- **本番データの移行前に必ずバックアップを取得してください**
- 移行中は旧システムを読み取り専用にすることを推奨
- `uid-mapping.json` には全ユーザーの Firebase UID が含まれます。Git にコミットしないでください（`.gitignore` に追加済み）
- `serviceAccountKey.json` も Git にコミットしないでください（`.gitignore` 対象）
- Firebase の無料枠に注意（特に Storage 容量と Firestore 書き込み数）
- payjp_customer_id などの決済情報は慎重に扱う
- 価格改定後は既存契約者の自動更新が旧価格で継続されることを確認
