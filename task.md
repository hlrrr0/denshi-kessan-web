# サービスリリースまでの残りタスク

## P0 — リリースブロッカー（必須）

- [x] 1. **法的ページ3つ作成** — `/terms`（利用規約）、`/privacy`（プライバシーポリシー）、`/law`（特定商取引法に基づく表記）
- [x] 2. **APIルートに認証チェック追加** — Firebase Auth IDトークン検証。他人のuserIdでの操作防止
- [x] 3. **`firebase-admin` を dependencies に移動** — devDependencies→dependencies。Vercelデプロイ時のビルドエラー防止
- [x] 4. **`console.log` の削除** — 50箇所以上のデバッグログ。UID・カードID等の機密データ出力を除去
- [x] 5. **公告一覧のフィルタリング** — サブスクリプション未契約企業を非表示にする
- [x] 5b. **Vercelビルド修正** — Pay.jp SDK遅延初期化 + useSearchParams Suspense境界追加

## P1 — 強く推奨

- [x] 6. **Pay.jp Webhook実装** — `/api/payjp/route.ts` で `subscription.renewed` / `charge.failed` / `subscription.deleted` を処理
- [x] 7. **パスワードリセット機能** — ログインページに「パスワードを忘れた方」導線 + `resetPassword` 関数追加
- [x] 8. **`error.tsx` / `not-found.tsx` 追加** — エラーバウンダリ、404表示、global-error.tsx
- [x] 9. **決算公告の削除機能** — Storage PDF削除 + Firestoreドキュメント削除 + 確認ダイアログ
- [x] 10. **LPのプレースホルダー画像差し替え** — HTML/CSSベースのUIモックに置換（2箇所）
- [x] 11. **`robots.txt` / `sitemap.xml` 作成** — App Router方式（robots.ts / sitemap.ts）
- [x] 12. **`.env.example` 作成** — 環境変数14個（Firebase 8 + Pay.jp 2 + reCAPTCHA 2）

## P2 — 推奨

- [x] 13. **OGPメタデータ設定** — OpenGraph / Twitter Card / canonical / metadataBase
- [x] 14. **セキュリティヘッダー追加** — X-Content-Type-Options / X-Frame-Options / HSTS / Referrer-Policy / Permissions-Policy
- [x] 15. **モバイルハンバーガーメニュー** — Header / TopHeader 両方にレスポンシブメニュー追加
- [x] 16. **`.backup` ファイル削除** — 2ファイル削除済み
- [x] 17. **テスト導入** — Jest + ts-jest。payjpユーティリティ17件 + Webhookハンドラ6件 = 計23テスト
- [x] 18. **CI/CD構築** — GitHub Actions（tsc + jest + next build）
