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
- [ ] 8. **`error.tsx` / `not-found.tsx` 追加** — エラーバウンダリ、404表示
- [ ] 9. **決算公告の削除機能** — マイページの「削除」ボタンのonClick未実装
- [ ] 10. **LPのプレースホルダー画像差し替え** — `[管理画面イメージ]` 等のモックテキスト3箇所
- [ ] 11. **`robots.txt` / `sitemap.xml` 作成** — SEO基本ファイル
- [ ] 12. **`.env.example` 作成** — 環境変数12個のサンプルファイル

## P2 — 推奨

- [ ] 13. OGPメタデータ設定
- [ ] 14. セキュリティヘッダー追加（`next.config.ts` にCSP等）
- [ ] 15. モバイルハンバーガーメニュー
- [ ] 16. `.backup` ファイル削除（2ファイル残存）
- [ ] 17. テスト導入
- [ ] 18. CI/CD構築
