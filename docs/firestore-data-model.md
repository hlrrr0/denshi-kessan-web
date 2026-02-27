# Firestore データモデル設計

## コレクション構造

```
firestore/
├── users/
│   └── {userId}/
│       ├── profile (document)
│       └── subscription (document)
├── companies/
│   └── {companyId}/
│       └── notices (subcollection)
│           └── {noticeId}/
└── subscriptionPlans/ (定数データ)
    └── {planId}/
```

## 1. users コレクション

### users/{userId}

```typescript
{
  uid: string;                    // Firebase Auth UID
  legacyUuid: string;            // 旧システムのuuid（移行時のみ）
  email: string;
  name: string;
  phone: string;
  active: boolean;
  payjpCustomerId: string;
  payjpCardId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### users/{userId}/subscription (サブコレクション)

```typescript
{
  subscriptionPlanId: string;    // 1year / 5year
  payjpChargeId: string;
  payjpSubscriptionId: string;
  active: boolean;               // Firestoreに保存される値（登録時: true）
  expirationDate: Timestamp;     // 有効期限
  automaticRenewalFlag: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**重要: `active` フィールドの扱い**

- **Firestoreに保存される値**: 登録時に `true`、明示的に削除しない限り `true` のまま
- **アプリケーションでの判定**: 
  ```typescript
  const expirationDate = subscription.expirationDate?.toDate();
  const isExpired = expirationDate ? new Date() > expirationDate : true;
  const isActive = subscription.active && !isExpired;
  ```
- **期限切れ判定**: `expirationDate` が現在日時より過去の場合、`isActive = false` として扱う
- **表示制御**:
  - マイページ: 期限切れの場合は警告メッセージと再登録ボタンを表示
  - 決算公告一覧: 有効なサブスクリプション(`isActive = true`)を持つユーザーの企業のみ表示

**自動更新失敗時の動作**:
- 1年プラン（定期課金）でカード期限切れなどにより決済失敗した場合
  - Pay.jpが自動的に `expirationDate` を更新しない
  - `expirationDate` が過去になる → `isActive = false` として扱われる
  - ユーザーは期限切れ警告を見てカード情報を更新し、再登録が必要
  - 決算公告は自動的に非公開になる（一覧に表示されなくなる）

## 2. companies コレクション

### companies/{companyId}

```typescript
{
  userId: string;                // users/{userId} への参照
  name: string;
  nameFurigana: string;
  establishmentDate: string;
  representativeName: string;
  capital: number;
  amountOfSales: number;
  numberOfEmployees: number;
  businessDescription: string;
  officeAddress: string;
  officialHomepageUrl: string;
  accountClosingMonth: number;   // 1-12
  
  // 🆕 非正規化フィールド（パフォーマンス最適化）
  subscriptionActive: boolean;   // サブスクリプションの有効状態
  subscriptionExpiresAt: Timestamp; // サブスクリプション有効期限
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**非正規化フィールドについて**:

- **目的**: 決算公告一覧ページでのパフォーマンス最適化（N+1問題の解決）
- **更新タイミング**:
  - サブスクリプション登録時: `subscriptionActive: true`, `subscriptionExpiresAt: 期限` に更新
  - サブスクリプションキャンセル時: 期限までは `subscriptionActive: true` のまま維持
  - 期限切れ: クライアント側で `subscriptionExpiresAt < 現在時刻` でチェック
- **クエリ例**:
  ```typescript
  query(
    collection(db, "companies"),
    where("subscriptionActive", "==", true),
    where("subscriptionExpiresAt", ">", Timestamp.now())
  )
  ```
- **データ整合性**: ユーザーのサブスクリプション状態が真の情報源、companiesは読み取り最適化用のキャッシュ

### companies/{companyId}/notices/{noticeId}

```typescript
{
  uuid: string;                  // 公開URL用のユニークID
  userId: string;                // 参照用
  title: string;
  pdfUrl: string;                // Firebase Storage URL
  pdfPath: string;               // Storage path
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 3. subscriptionPlans コレクション（定数データ）

### subscriptionPlans/{planId}

```typescript
{
  id: string;                    // "1year" | "5year"
  name: string;                  // "1年プラン" | "5年プラン"
  price: number;
  periodMonths: number;          // 12 | 60
  payjpPlanId: string;
  description: string;
}
```

## Storage 構造

```
storage/
└── notices/
    └── {userId}/
        └── {noticeId}/
            └── {filename}.pdf
```

## セキュリティルール（後で設定）

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 企業情報は所有者のみ編集、公開データは誰でも閲覧可
    match /companies/{companyId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
      
      match /notices/{noticeId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // サブスクリプションプランは誰でも閲覧可能
    match /subscriptionPlans/{planId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /notices/{userId}/{noticeId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## データ移行マッピング

### MySQL → Firestore

| MySQL テーブル | Firestore コレクション | 備考 |
|---------------|---------------------|------|
| users | users/{userId} | Firebase Authと連携 |
| company_informations | companies/{companyId} | - |
| electronic_public_notices | companies/{companyId}/notices/{noticeId} | - |
| user_subscription_plans | users/{userId}/subscription | サブコレクション |
| ローカルPDF | Storage: notices/{userId}/{noticeId}/ | - |
