# Firebase セットアップガイド

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `denshi-kessan-web` (任意)
4. Google Analytics: 有効化推奨
5. 作成完了を待つ

## 2. Firebase Authentication の設定

1. Firebase Console > 構築 > Authentication
2. 「始める」をクリック
3. ログイン方法タブで「メール/パスワード」を有効化
4. 保存

## 3. Cloud Firestore の設定

1. Firebase Console > 構築 > Firestore Database
2. 「データベースの作成」をクリック
3. ロケーション: `asia-northeast1` (東京) を推奨
4. セキュリティルール: **本番環境モードで開始** を選択
5. 「有効にする」をクリック

### セキュリティルールの設定

Firestoreの「ルール」タブで以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /subscription/{document=**} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    match /companies/{companyId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
      
      match /notices/{noticeId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    match /subscriptionPlans/{planId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 4. Cloud Storage の設定

1. Firebase Console > 構築 > Storage
2. 「始める」をクリック
3. セキュリティルール: **本番環境モードで開始**
4. ロケーション: Firestoreと同じ `asia-northeast1`
5. 「完了」をクリック

### ⚠️ 重要: Storageセキュリティルールの設定（必須）

**この設定を行わないと、ファイルアップロードでCORSエラーが発生します！**

#### 手順：

1. **Firebase Console** で `denshi-kessan-web` プロジェクトを開く
2. 左メニュー「**構築**」→「**Storage**」をクリック
3. 上部タブの「**ルール**」をクリック
4. エディタに表示されているデフォルトのルールを**すべて削除**
5. 以下のルールを**コピー＆ペースト**：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notices/{userId}/{companyId}/{filename} {
      // 誰でも読み取り可能（公開決算公告のため）
      allow read: if true;
      // 認証済みユーザー本人のみアップロード可能
      allow write: if request.auth != null && request.auth.uid == userId;
      // 認証済みユーザー本人のみ削除可能
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. 右上の「**公開**」ボタンをクリック（これを忘れずに！）
7. 確認ダイアログが表示されたら「**公開**」をクリック

#### 確認方法：

- ルールが正しく公開されると、「ルール」タブに「最終更新日時」が表示されます
- ブラウザで `http://localhost:3000/mypage/upload` を再読み込み
- PDFファイルをアップロードしてテスト

#### トラブルシューティング：

もし上記のルールでもエラーが出る場合は、**一時的に**以下のテスト用ルールを使用してください：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // 認証済みユーザーは全ての操作が可能（テスト用）
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **注意**: テスト用ルールは開発環境でのみ使用してください。動作確認後、本番用のルール（最初のもの）に戻してください。

## 5. Web アプリの追加

1. Firebase Console > プロジェクト設定（歯車アイコン）
2. 「全般」タブ > マイアプリ > Webアイコン（</>）をクリック
3. アプリのニックネーム: `denshi-kessan-web`
4. Firebase Hosting: チェックなし
5. 「アプリを登録」をクリック
6. **firebaseConfig の値をコピー**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "denshi-kessan-web.firebaseapp.com",
  projectId: "denshi-kessan-web",
  storageBucket: "denshi-kessan-web.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

7. これらの値を `.env.local` に設定：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=denshi-kessan-web.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=denshi-kessan-web
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=denshi-kessan-web.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 6. サービスアカウントキーの取得（データ移行用）

1. Firebase Console > プロジェクト設定 > サービス アカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONファイルを `scripts/migration/serviceAccountKey.json` に配置
4. **⚠️ このファイルは絶対にGitにコミットしない**

### .gitignore に追加

```bash
# Firebase Admin SDK
scripts/migration/serviceAccountKey.json
scripts/migration/*.json
migration-data/
```

## 7. Vercel への環境変数設定

1. [Vercel Dashboard](https://vercel.com/dashboard)
2. プロジェクトを選択
3. Settings > Environment Variables
4. 以下を追加：

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

5. すべての環境（Production / Preview / Development）にチェック
6. Save

## 8. 依存パッケージのインストール

```bash
npm install
```

## 次のステップ

- [データ移行手順](../migration/README.md) に従ってMySQLデータを移行
- ローカルで動作確認: `npm run dev`
- Vercelに再デプロイ
