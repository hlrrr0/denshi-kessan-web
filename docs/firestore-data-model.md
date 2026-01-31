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
  active: boolean;
  expirationDate: Timestamp;
  automaticRenewalFlag: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

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
